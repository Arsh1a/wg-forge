import { createHash, randomBytes } from 'crypto';
import { readFileSync } from 'fs';

const WEB_CONF = '/etc/wg-forge/web.conf';
const SESSION_TTL = 24 * 60 * 60 * 1000;
const sessions = new Map<string, number>();

function getWebConf(): Record<string, string> {
  const out: Record<string, string> = {};
  readFileSync(WEB_CONF, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^(\w+)="?([^"]*)"?$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

export function verifyPassword(username: string, password: string): boolean {
  const conf = getWebConf();
  if (username !== conf['WEB_USER']) return false;
  const [salt, hash] = (conf['WEB_PASS_HASH'] ?? '').split(':');
  const check = createHash('sha256').update(salt + password).digest('hex');
  return check === hash;
}

export function createSession(): string {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  return token;
}

export function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry || Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
