import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const CLIENTS_FILE = '/etc/wireguard/clients.conf';
const LIMITS_FILE  = '/etc/wireguard/limits.conf';
const TOTAL_FILE   = '/etc/wireguard/total_bandwidth.conf';
const FORGE_CONF   = '/etc/wg-forge/config.conf';

interface PeerDump {
  lastHandshake: number;
  rx: number;
  tx: number;
}

interface LimitEntry {
  limitBytes: number;
  sessionBytes: number;
  status: string;
}

export interface Client {
  name: string;
  pubkey: string;
  ip: string;
  status: string;
  limitBytes: number;
  limitHuman: string;
  sessionHuman: string;
  lifetimeHuman: string;
  usagePct: string | null;
  lastSeen: string;
}

function readLines(path: string): string[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'));
}

function parseConf(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  readFileSync(path, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^(\w+)="?([^"]*)"?$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

function bytesToHuman(b: number): string {
  if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
  if (b >= 1048576)    return (b / 1048576).toFixed(2) + ' MB';
  if (b >= 1024)       return (b / 1024).toFixed(2) + ' KB';
  return b + ' B';
}

function getWgDump(iface: string): string {
  try {
    return execSync(`wg show ${iface} dump`, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

export function getConfig(): Record<string, string> {
  return parseConf(FORGE_CONF);
}

// Render a client .conf from the server config. DNS falls back to 8.8.8.8 and
// AllowedIPs to 0.0.0.0/0 (full tunnel) for installs created before WG_DNS /
// WG_ALLOWED_IPS existed.
export function buildClientConfig(
  cfg: Record<string, string>,
  privateKey: string,
  address: string
): string {
  return [
    '[Interface]',
    `PrivateKey = ${privateKey}`,
    `Address = ${address}`,
    `DNS = ${cfg['WG_DNS'] || '8.8.8.8'}`,
    '',
    '[Peer]',
    `PublicKey = ${cfg['VPS_PUBKEY'] ?? ''}`,
    `Endpoint = ${cfg['VPS_ENDPOINT'] ?? ''}`,
    `AllowedIPs = ${cfg['WG_ALLOWED_IPS'] || '0.0.0.0/0'}`,
    'PersistentKeepalive = 25'
  ].join('\n');
}

export function getClients(): Client[] {
  const cfg  = getConfig();
  const dump = getWgDump(cfg['WG_INTERFACE'] ?? 'wg0');
  const peers: Record<string, PeerDump> = {};

  dump.split('\n').forEach((line) => {
    const parts = line.split('\t');
    if (parts.length < 8) return;
    const [pubkey, , , , lastHandshake, rx, tx] = parts;
    peers[pubkey] = {
      lastHandshake: Number(lastHandshake),
      rx: Number(rx),
      tx: Number(tx)
    };
  });

  const limits: Record<string, LimitEntry> = {};
  readLines(LIMITS_FILE).forEach((l) => {
    const [name, limitBytes, sessionBytes, status] = l.split(':');
    limits[name] = {
      limitBytes: Number(limitBytes),
      sessionBytes: Number(sessionBytes),
      status
    };
  });

  const totals: Record<string, number> = {};
  readLines(TOTAL_FILE).forEach((l) => {
    const [name, bytes] = l.split(':');
    totals[name] = Number(bytes);
  });

  return readLines(CLIENTS_FILE).map((l) => {
    const [name, pubkey, ip] = l.split(':');
    const peer    = peers[pubkey] ?? {};
    const lim     = limits[name] ?? {};
    const session = ((peer as PeerDump).rx ?? 0) + ((peer as PeerDump).tx ?? 0);
    const lifetime = totals[name] ?? 0;

    let lastSeen = 'never';
    if ((peer as PeerDump).lastHandshake) {
      const ago = Math.floor(Date.now() / 1000) - (peer as PeerDump).lastHandshake;
      if (ago < 60)        lastSeen = `${ago}s ago`;
      else if (ago < 3600) lastSeen = `${Math.floor(ago / 60)}m ago`;
      else                 lastSeen = `${Math.floor(ago / 3600)}h ago`;
    }

    return {
      name,
      pubkey,
      ip: ip?.replace('/32', '') ?? '',
      status:        lim.status ?? 'active',
      limitBytes:    lim.limitBytes ?? 0,
      limitHuman:    lim.limitBytes ? bytesToHuman(lim.limitBytes) : 'unlimited',
      sessionHuman:  bytesToHuman(session),
      lifetimeHuman: bytesToHuman(lifetime),
      usagePct:      lim.limitBytes
        ? Math.min(100, (session / lim.limitBytes) * 100).toFixed(1)
        : null,
      lastSeen
    };
  });
}

export function runForge(args: string): string {
  return execSync(`wg-forge ${args}`, { encoding: 'utf8' });
}
