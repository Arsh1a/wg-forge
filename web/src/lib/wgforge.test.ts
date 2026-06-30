import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// wgforge.ts reads several fixed files and shells out to `wg show <iface> dump`.
// We mock fs + child_process so we can feed it controlled fixtures.
const readFileSync = vi.fn();
const existsSync = vi.fn();
const execSync = vi.fn();

vi.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => readFileSync(...args),
  existsSync: (...args: unknown[]) => existsSync(...args)
}));
vi.mock('child_process', () => ({
  execSync: (...args: unknown[]) => execSync(...args)
}));

import { getConfig, getClients, buildClientConfig } from './wgforge';

const FORGE_CONF = '/etc/wg-forge/config.conf';
const CLIENTS_FILE = '/etc/wireguard/clients.conf';
const LIMITS_FILE = '/etc/wireguard/limits.conf';
const TOTAL_FILE = '/etc/wireguard/total_bandwidth.conf';

const GB = 1073741824;
const MB = 1048576;

// A peer line from `wg show <iface> dump`: 8 tab-separated columns
// pubkey, preshared-key, endpoint, allowed-ips, latest-handshake, rx, tx, keepalive
function dumpPeer(pubkey: string, handshake: number, rx: number, tx: number): string {
  return [pubkey, '(none)', '1.2.3.4:51820', '10.99.0.3/32', handshake, rx, tx, '25'].join('\t');
}

// The first line of a dump describes the interface (4 columns) and is ignored.
const IFACE_LINE = ['SRVPRIV', 'SRVPUB', '51820', 'off'].join('\t');

function mockFiles(files: Record<string, string>): void {
  readFileSync.mockImplementation((path: string) => {
    if (path in files) return files[path];
    throw new Error(`unexpected read: ${path}`);
  });
  existsSync.mockImplementation((path: string) => path in files);
}

beforeEach(() => {
  readFileSync.mockReset();
  existsSync.mockReset();
  execSync.mockReset();
  execSync.mockReturnValue('');
});

describe('getConfig', () => {
  it('parses quoted and unquoted KEY=value lines', () => {
    mockFiles({
      [FORGE_CONF]:
        '# wg-forge configuration\n' +
        'WG_INTERFACE="wg0"\n' +
        'VPS_ENDPOINT="1.2.3.4:51820"\n' +
        'WG_SUBNET=10.99.0\n'
    });
    expect(getConfig()).toEqual({
      WG_INTERFACE: 'wg0',
      VPS_ENDPOINT: '1.2.3.4:51820',
      WG_SUBNET: '10.99.0'
    });
  });
});

describe('getClients', () => {
  it('returns an empty list when there are no clients', () => {
    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]: '# wg-forge data\n',
      [LIMITS_FILE]: '# wg-forge data\n',
      [TOTAL_FILE]: '# wg-forge data\n'
    });
    expect(getClients()).toEqual([]);
  });

  it('joins client registry, limits, lifetime totals and live usage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const nowSec = Math.floor(Date.now() / 1000);

    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]:
        '# wg-forge data\n' +
        'alice:PUBKEY_A:10.99.0.3/32\n' +
        'bob:PUBKEY_B:10.99.0.4/32\n',
      [LIMITS_FILE]:
        '# wg-forge data\n' +
        `alice:${GB}:0:active\n` +
        'bob:0:0:active\n',
      [TOTAL_FILE]: '# wg-forge data\n' + `alice:${GB / 2}\n`
    });
    // alice has a live peer (100MB down + 100MB up, handshake 30s ago);
    // bob has no entry in the dump.
    execSync.mockReturnValue(
      IFACE_LINE + '\n' + dumpPeer('PUBKEY_A', nowSec - 30, 100 * MB, 100 * MB) + '\n'
    );

    const clients = getClients();
    expect(execSync).toHaveBeenCalledWith('wg show wg0 dump', expect.anything());

    const alice = clients.find((c) => c.name === 'alice')!;
    expect(alice).toMatchObject({
      name: 'alice',
      pubkey: 'PUBKEY_A',
      ip: '10.99.0.3', // /32 stripped
      status: 'active',
      limitBytes: GB,
      limitHuman: '1.00 GB',
      sessionHuman: '200.00 MB',
      lifetimeHuman: '512.00 MB',
      usagePct: '19.5',
      lastSeen: '30s ago'
    });

    const bob = clients.find((c) => c.name === 'bob')!;
    expect(bob).toMatchObject({
      ip: '10.99.0.4',
      limitBytes: 0,
      limitHuman: 'unlimited',
      sessionHuman: '0 B',
      usagePct: null,
      lastSeen: 'never'
    });
  });

  it('caps usagePct at 100 when a client is over the limit', () => {
    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]: 'carol:PUBKEY_C:10.99.0.5/32\n',
      [LIMITS_FILE]: `carol:${GB}:0:active\n`,
      [TOTAL_FILE]: ''
    });
    execSync.mockReturnValue(dumpPeer('PUBKEY_C', 0, 2 * GB, GB));
    const carol = getClients()[0];
    expect(carol.usagePct).toBe('100.0');
  });

  it('falls back to defaults when wg dump is unavailable', () => {
    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]: 'dave:PUBKEY_D:10.99.0.6/32\n',
      [LIMITS_FILE]: '',
      [TOTAL_FILE]: ''
    });
    execSync.mockImplementation(() => {
      throw new Error('wg not installed');
    });
    const dave = getClients()[0];
    expect(dave).toMatchObject({
      status: 'active',
      sessionHuman: '0 B',
      lastSeen: 'never',
      usagePct: null
    });
  });

  it('parses the optional expiry field and renders time remaining', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const nowSec = Math.floor(Date.now() / 1000);

    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]:
        '# wg-forge data\n' +
        'soon:PUBKEY_S:10.99.0.3/32\n' +    // expires in 2 days
        'gone:PUBKEY_G:10.99.0.4/32\n' +    // already expired
        'forever:PUBKEY_F:10.99.0.5/32\n',  // explicit 0 = never
      [LIMITS_FILE]:
        '# wg-forge data\n' +
        `soon:0:0:active:${nowSec + 2 * 86400}\n` +
        `gone:0:0:disabled:${nowSec - 100}\n` +
        'forever:0:0:active:0\n',
      [TOTAL_FILE]: '# wg-forge data\n'
    });

    const byName = Object.fromEntries(getClients().map((c) => [c.name, c]));
    expect(byName.soon).toMatchObject({ expiresHuman: '2d left', expiryEpoch: nowSec + 2 * 86400 });
    expect(byName.gone).toMatchObject({ expiresHuman: 'expired' });
    expect(byName.forever).toMatchObject({ expiresHuman: 'never', expiryEpoch: 0 });
  });

  it('treats a legacy 4-field limits line as no expiry', () => {
    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]: 'legacy:PUBKEY_L:10.99.0.7/32\n',
      [LIMITS_FILE]: `legacy:${GB}:0:active\n`,
      [TOTAL_FILE]: ''
    });
    const legacy = getClients()[0];
    expect(legacy).toMatchObject({ expiresHuman: 'never', expiryEpoch: 0 });
  });

  it('formats byte sizes across B/KB/MB/GB boundaries', () => {
    mockFiles({
      [FORGE_CONF]: 'WG_INTERFACE="wg0"\n',
      [CLIENTS_FILE]:
        'b:PB:10.0.0.1/32\nk:PK:10.0.0.2/32\nm:PM:10.0.0.3/32\ng:PG:10.0.0.4/32\n',
      [LIMITS_FILE]: '',
      [TOTAL_FILE]: 'b:512\nk:2048\nm:3145728\ng:1610612736\n'
    });
    const byName = Object.fromEntries(getClients().map((c) => [c.name, c.lifetimeHuman]));
    expect(byName).toEqual({
      b: '512 B',
      k: '2.00 KB',
      m: '3.00 MB',
      g: '1.50 GB'
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});

describe('buildClientConfig', () => {
  // Pure function — no fs/exec mocking needed.
  const cfg = {
    VPS_PUBKEY: 'SRVPUB',
    VPS_ENDPOINT: '1.2.3.4:51820'
  };

  it('uses WG_DNS from config when set', () => {
    const conf = buildClientConfig({ ...cfg, WG_DNS: '1.1.1.1' }, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('DNS = 1.1.1.1');
  });

  it('falls back to 8.8.8.8 when WG_DNS is absent', () => {
    const conf = buildClientConfig(cfg, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('DNS = 8.8.8.8');
  });

  it('falls back to 8.8.8.8 when WG_DNS is empty', () => {
    const conf = buildClientConfig({ ...cfg, WG_DNS: '' }, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('DNS = 8.8.8.8');
  });

  it('preserves comma-separated DNS servers', () => {
    const conf = buildClientConfig({ ...cfg, WG_DNS: '1.1.1.1, 1.0.0.1' }, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('DNS = 1.1.1.1, 1.0.0.1');
  });

  it('embeds the private key, address, and server peer details', () => {
    const conf = buildClientConfig({ ...cfg, WG_DNS: '8.8.8.8' }, 'CLIENTPRIV', '10.99.0.3/32');
    expect(conf).toContain('PrivateKey = CLIENTPRIV');
    expect(conf).toContain('Address = 10.99.0.3/32');
    expect(conf).toContain('PublicKey = SRVPUB');
    expect(conf).toContain('Endpoint = 1.2.3.4:51820');
    expect(conf).toContain('AllowedIPs = 0.0.0.0/0');
    expect(conf).toContain('PersistentKeepalive = 25');
  });

  it('uses WG_ALLOWED_IPS for a split tunnel when set', () => {
    const conf = buildClientConfig({ ...cfg, WG_ALLOWED_IPS: '10.0.0.0/8' }, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('AllowedIPs = 10.0.0.0/8');
    expect(conf).not.toContain('AllowedIPs = 0.0.0.0/0');
  });

  it('falls back to full tunnel when WG_ALLOWED_IPS is absent', () => {
    const conf = buildClientConfig(cfg, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('AllowedIPs = 0.0.0.0/0');
  });

  it('falls back to full tunnel when WG_ALLOWED_IPS is empty', () => {
    const conf = buildClientConfig({ ...cfg, WG_ALLOWED_IPS: '' }, 'PRIV', '10.99.0.3/32');
    expect(conf).toContain('AllowedIPs = 0.0.0.0/0');
  });

  it('preserves comma-separated routes', () => {
    const conf = buildClientConfig(
      { ...cfg, WG_ALLOWED_IPS: '10.0.0.0/8, 192.168.1.0/24' },
      'PRIV',
      '10.99.0.3/32'
    );
    expect(conf).toContain('AllowedIPs = 10.0.0.0/8, 192.168.1.0/24');
  });
});
