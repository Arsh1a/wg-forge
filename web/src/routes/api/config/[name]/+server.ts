import { json, error } from '@sveltejs/kit';
import { existsSync, readFileSync } from 'fs';
import { getConfig } from '$lib/wgforge.js';
import type { RequestHandler } from './$types';

const CLIENTS_FILE = '/etc/wireguard/clients.conf';

export const GET: RequestHandler = ({ params }) => {
  const { name } = params;

  const line = readFileSync(CLIENTS_FILE, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(name + ':'));
  if (!line) throw error(404, 'Client not found');

  const [, , ip] = line.split(':');
  const keyFile = `/etc/wireguard/keys/${name}.key`;
  if (!existsSync(keyFile)) throw error(404, 'Key file missing');

  const cfg = getConfig();
  const privateKey = readFileSync(keyFile, 'utf8').trim();
  const address = ip.trim();
  const endpoint = cfg['VPS_ENDPOINT'] ?? '';
  const serverPubkey = cfg['VPS_PUBKEY'] ?? '';

  const config = [
    '[Interface]',
    `PrivateKey = ${privateKey}`,
    `Address = ${address}`,
    'DNS = 8.8.8.8',
    '',
    '[Peer]',
    `PublicKey = ${serverPubkey}`,
    `Endpoint = ${endpoint}`,
    'AllowedIPs = 0.0.0.0/0',
    'PersistentKeepalive = 25',
  ].join('\n');

  return json({ config, name });
};
