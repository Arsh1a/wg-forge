# wg-forge

Self-hosted WireGuard server manager. Sets up a VPN server from scratch, manages clients with bandwidth limits, and includes a web dashboard.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/Arsh1a/wg-forge/main/install.sh | sudo bash
sudo wg-forge setup
```

`wg-forge setup` walks you through installing WireGuard, configuring the server, and optionally setting up the web dashboard.

## Web Dashboard

The web dashboard lets you manage clients from a browser. It is set up as part of `wg-forge setup`.

- Add, remove, disable, and enable clients
- Extend bandwidth limits
- See live session usage and last-seen time
- Protected by a secret URL (only people with the link can reach the login page)

To see your dashboard URL and credentials at any time:

```bash
wg-forge web
```

## Commands

```
wg-forge setup                 Install WireGuard + configure server (run once)
wg-forge web                   Show web dashboard URL and status

wg-forge add <n> [limit]       Create client  (e.g. add john 10GB)
wg-forge remove <n>            Remove client
wg-forge show <n>              Show config + QR code
wg-forge list                  List all clients
wg-forge disable <n>           Revoke access
wg-forge enable <n>            Restore access + reset session
wg-forge extend <n> <amount>   Add bandwidth  (e.g. extend john 5GB)
wg-forge setlimit <n> <limit>  Change bandwidth limit
wg-forge setdns <dns>          Set DNS pushed to clients (e.g. 1.1.1.1)
wg-forge setroutes <ips>       Set client routes / split tunnel (e.g. 0.0.0.0/0)
wg-forge regenerate <n>        Issue new keypair
wg-forge total                 Lifetime usage per user
wg-forge update [version]      Update to latest release
```

## Split tunneling

By default every client routes **all** its traffic through the VPN (`AllowedIPs = 0.0.0.0/0`, a full tunnel). To send only specific subnets through the VPN and leave the rest on the client's normal connection (a split tunnel), set the client routes:

```bash
wg-forge setroutes 10.0.0.0/8                 # only the 10.x range via VPN
wg-forge setroutes '10.0.0.0/8, 192.168.1.0/24'  # multiple subnets
wg-forge setroutes 0.0.0.0/0                  # back to a full tunnel
```

This is also asked during `wg-forge setup`. Existing clients keep their old routes until you re-share their config (`wg-forge show <name>`) or regenerate it.

## Requirements

- Linux (Debian/Ubuntu/Fedora/RHEL/Arch)
- Root
- `curl`, `perl`, `bc` — installed automatically if missing
- WireGuard — installed automatically by `wg-forge setup`
- Node.js — installed automatically if you opt into the web dashboard

## Files

| Path                                  | Purpose              |
| ------------------------------------- | -------------------- |
| `/etc/wg-forge/config.conf`           | Server configuration |
| `/etc/wg-forge/web.conf`              | Web dashboard config |
| `/etc/wireguard/clients.conf`         | Client registry      |
| `/etc/wireguard/limits.conf`          | Per-client limits    |
| `/etc/wireguard/total_bandwidth.conf` | Lifetime usage       |
| `/etc/wireguard/keys/`                | Private keys         |
| `/opt/wg-forge-web/`                  | Web dashboard source |

## Uninstall

```bash
# Stop and remove services
systemctl stop wg-quick@wg0 wg-forge-web wg-forge-checklimits.timer wg-forge-checklimits.service
systemctl disable wg-quick@wg0 wg-forge-web wg-forge-checklimits.timer wg-forge-checklimits.service
rm -f /etc/systemd/system/wg-forge-web.service
rm -f /etc/systemd/system/wg-forge-checklimits.service
rm -f /etc/systemd/system/wg-forge-checklimits.timer
systemctl daemon-reload

# Remove wg-forge files
rm -f /usr/local/bin/wg-forge
rm -rf /etc/wg-forge
rm -rf /opt/wg-forge-web

# Remove WireGuard config and client data (destructive — all peers lost)
wg-quick down wg0
rm -rf /etc/wireguard
```

To also remove WireGuard itself: `apt remove --purge wireguard wireguard-tools` (or `dnf`/`pacman` equivalent).

## Development

### Tests

The project has two test suites, both run on every push and pull request via [GitHub Actions](.github/workflows/ci.yml).

**CLI (bash)** — unit tests for the helper functions in `wg-forge`, written with [bats](https://github.com/bats-core/bats-core):

```bash
# Debian/Ubuntu: sudo apt-get install bats bc
bats test/
```

**Web dashboard (TypeScript)** — unit tests for the session and WireGuard data layers, written with [Vitest](https://vitest.dev/):

```bash
cd web
npm install
npm test          # run once
npm run test:watch
```

## License

MIT
