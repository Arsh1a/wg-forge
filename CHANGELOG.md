# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-04-29

### Added

- Bulk actions in the web dashboard

## [0.4.0] - 2026-04-29

### Fixed

- nginx and certbot now install correctly during HTTPS setup — `install_wg_deps` was hardcoded to WireGuard packages and ignored arguments; replaced with a generic `install_pkgs` helper
- `wg-forge update` no longer errors with `getcwd` — fixed by `cd /tmp` before removing the web directory
- Removed `setup-web` subcommand (was incomplete)

## [0.3.9] - 2026-04-29

### Fixed

- `wg-forge setup` now automatically opens the web port in ufw when the firewall is active

## [0.3.8] - 2026-04-29

### Fixed

- `wg-forge update` now replaces the CLI binary last to prevent bash from reading the new file mid-execution and throwing a syntax error

## [0.3.7] - 2026-04-28

### Fixed

- Double `/32` suffix bug in `enable`, `extend`, and `regenerate` commands causing WireGuard to reject peers

## [0.3.6] - 2026-04-28

### Fixed

- `wg-forge update` now does a fully clean install

## [0.3.5] - 2026-04-28

### Fixed

- Fixed text coloring issue on web dashboard

## [0.3.4] - 2026-04-28

### Fixed

- Copy button in share modal now works over plain HTTP using a `execCommand` fallback (clipboard API requires HTTPS)
- Default text color set to white globally to fix black text appearing in modal and other components

## [0.3.3] - 2026-04-28

### Fixed

- `wg-forge update` now updates in-place without requiring `wg-forge setup` again — updates the CLI binary, systemd units, web source, rebuilds the web dashboard, and restarts services, all while leaving WireGuard config and client data untouched

## [0.3.2] - 2026-04-28

### Added

- Key regeneration in the web dashboard

## [0.3.1] - 2026-04-27

### Added

- Config sharing in the web dashboard

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
