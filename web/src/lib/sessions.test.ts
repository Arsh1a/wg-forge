import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';

// sessions.ts reads /etc/wg-forge/web.conf via fs.readFileSync. We mock the
// module so tests can drive the conf contents without touching the filesystem.
const readFileSync = vi.fn();
vi.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => readFileSync(...args)
}));

import {
  verifyPassword,
  createSession,
  validateSession,
  deleteSession
} from './sessions';

// Build a valid salt:hash pair the way cmd_setup_web does (sha256(salt+pass)).
function hashFor(salt: string, password: string): string {
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

function setConf(conf: Record<string, string>): void {
  const text = Object.entries(conf)
    .map(([k, v]) => `${k}="${v}"`)
    .join('\n');
  readFileSync.mockReturnValue(text);
}

beforeEach(() => {
  readFileSync.mockReset();
});

describe('verifyPassword', () => {
  it('accepts the correct username and password', () => {
    setConf({ WEB_USER: 'admin', WEB_PASS_HASH: hashFor('deadbeef', 's3cret') });
    expect(verifyPassword('admin', 's3cret')).toBe(true);
  });

  it('rejects a wrong password', () => {
    setConf({ WEB_USER: 'admin', WEB_PASS_HASH: hashFor('deadbeef', 's3cret') });
    expect(verifyPassword('admin', 'wrong')).toBe(false);
  });

  it('rejects a wrong username', () => {
    setConf({ WEB_USER: 'admin', WEB_PASS_HASH: hashFor('deadbeef', 's3cret') });
    expect(verifyPassword('root', 's3cret')).toBe(false);
  });

  it('rejects when no password hash is configured', () => {
    setConf({ WEB_USER: 'admin' });
    expect(verifyPassword('admin', '')).toBe(false);
    expect(verifyPassword('admin', 'anything')).toBe(false);
  });

  it('parses conf values whether or not they are quoted', () => {
    readFileSync.mockReturnValue(
      `WEB_USER=admin\nWEB_PASS_HASH=${hashFor('abc123', 'pw')}`
    );
    expect(verifyPassword('admin', 'pw')).toBe(true);
  });
});

describe('session lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a token that validates immediately', () => {
    const token = createSession();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(validateSession(token)).toBe(true);
  });

  it('issues a unique token each time', () => {
    expect(createSession()).not.toBe(createSession());
  });

  it('rejects an undefined or unknown token', () => {
    expect(validateSession(undefined)).toBe(false);
    expect(validateSession('not-a-real-token')).toBe(false);
  });

  it('expires a token after the 24h TTL', () => {
    const token = createSession();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    expect(validateSession(token)).toBe(false);
  });

  it('keeps a token valid just before the TTL', () => {
    const token = createSession();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1000);
    expect(validateSession(token)).toBe(true);
  });

  it('invalidates a token after deleteSession', () => {
    const token = createSession();
    deleteSession(token);
    expect(validateSession(token)).toBe(false);
  });
});
