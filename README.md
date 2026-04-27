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

## License

MIT
