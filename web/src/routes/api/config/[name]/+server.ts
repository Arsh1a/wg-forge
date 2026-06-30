import { json, error } from '@sveltejs/kit';
import { existsSync, readFileSync } from 'fs';
import { getConfig, buildClientConfig } from '$lib/wgforge.js';
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

  const config = buildClientConfig(cfg, privateKey, address);

  return json({ config, name });
};
