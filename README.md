# wg-forge

WireGuard client manager - add/remove peers, enforce bandwidth limits, track usage from the command line.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/Arsh1a/wg-forge/main/install.sh | sudo bash
sudo wg-forge setup
```

## Commands

```
wg-forge setup                 First-run setup
wg-forge add <n> [limit]       Create client  (e.g. add john 10GB)
wg-forge remove <n>            Remove client
wg-forge show <n>              Show info + config
wg-forge list                  List all clients
wg-forge disable <n>           Revoke access
wg-forge enable <n>            Restore + reset session
wg-forge extend <n> <amount>   Add bandwidth  (e.g. extend john 5GB)
wg-forge setlimit <n> <limit>  Change limit
wg-forge regenerate <n>        Issue new keypair
wg-forge total                 Lifetime usage per user
wg-forge checklimits           Enforce limits (run by cron)
```

## Requirements

- Linux (Debian/Ubuntu/Fedora/RHEL/Arch)
- Root
- `curl`, `perl`, `bc` — installed automatically if missing
- WireGuard — installed automatically by `wg-forge setup` if missing

## Files

| Path                                  | Purpose           |
| ------------------------------------- | ----------------- |
| `/etc/wg-forge/config.conf`           | Configuration     |
| `/etc/wireguard/clients.conf`         | Client registry   |
| `/etc/wireguard/limits.conf`          | Per-client limits |
| `/etc/wireguard/total_bandwidth.conf` | Lifetime usage    |
| `/etc/wireguard/keys/`                | Private keys      |

## Uninstall

```bash
# Stop and remove services
systemctl stop wg-forge-web wg-forge-checklimits.timer wg-forge-checklimits.service
systemctl disable wg-forge-web wg-forge-checklimits.timer wg-forge-checklimits.service
rm -f /etc/systemd/system/wg-forge-web.service
rm -f /etc/systemd/system/wg-forge-checklimits.service
rm -f /etc/systemd/system/wg-forge-checklimits.timer
systemctl daemon-reload

# Remove WireGuard interface
wg-quick down wg0
systemctl disable wg-quick@wg0

# Remove files
rm -f /usr/local/bin/wg-forge
rm -rf /etc/wg-forge
rm -rf /opt/wg-forge-web

# Remove WireGuard config and client data (destructive — all peers lost)
rm -rf /etc/wireguard
```

WireGuard itself (`wireguard-tools`, kernel module) is left installed — remove it with your package manager if you no longer need it (`apt remove wireguard-tools`, `dnf remove wireguard-tools`, etc.).

## License

MIT
