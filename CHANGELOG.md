# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-04-27

### Added

- Web dashboard at `web/`

## [0.2.3] - 2026-04-27

### Changed

- Bandwidth limit check interval reduced from 5 minutes to 30 seconds for faster enforcement

## [0.2.2] - 2026-04-27

### Added

- `wg-forge update [version]` — updates wg-forge in-place by re-running the installer; optionally pin to a specific version (e.g. `v0.2.1`)

## [0.2.1] - 2026-04-27

### Fixed

- Replaced unreliable cron job with a systemd timer (`wg-forge-checklimits.timer`) for bandwidth limit enforcement — ensures limits are checked every 5 minutes regardless of whether cron is installed

## [0.2.0] - 2026-04-27

### Changed

- `wg-forge setup` now fully initializes the WireGuard server from scratch:
  - Installs WireGuard if not present (apt/dnf/yum/pacman)
  - Auto-detects server public IP and default network interface
  - Generates server keypair and writes `/etc/wireguard/wg0.conf`
  - Enables IP forwarding via sysctl
  - Configures iptables NAT (PostUp/PostDown) so clients can route traffic through the server
  - Starts and enables `wg-quick@wg0` via systemd
- Users no longer need WireGuard setuped — `setup` handles everything

## [0.1.1] - 2026-04-27

### Fixed

- Installer now auto-installs missing dependencies on apt/dnf/yum/pacman systems instead of failing with an error

## [0.1.0] - 2026-04-27

### Added

- `wg-forge add` - create WireGuard clients with optional bandwidth limits
- `wg-forge remove` - remove a client and preserve bandwidth history
- `wg-forge show` - display client info, live session stats, and WireGuard config
- `wg-forge list` - table view of all clients with status, usage, and last seen
- `wg-forge disable` / `enable` - revoke and restore access; persisted in `wg0.conf` so state survives reboots
- `wg-forge extend` - add bandwidth to a client (re-enables if disabled)
- `wg-forge setlimit` - change a client's bandwidth cap
- `wg-forge regenerate` - issue a new keypair for a client
- `wg-forge checklimits` - enforce limits and update lifetime totals (designed for cron)
- `wg-forge total` - lifetime bandwidth usage per client
- `wg-forge setup` - interactive first-run configuration
- `wg-forge version` - print installed version
- `wg-forge-tracker` - background daemon accumulating interface-level bandwidth stats
- Systemd service (`wg-forge-tracker.service`) for the tracker daemon
- QR code output in `add` and `show` when `qrencode` is installed
- Client name validation - rejects names containing `:`, `/`, or special characters
- Installer (`install.sh`) downloads all files from GitHub; supports optional version pin (`sudo bash -s -- v1.0.0`)
