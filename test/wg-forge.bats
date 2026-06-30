#!/usr/bin/env bats
#
# Unit tests for the pure helper functions in the wg-forge CLI.
#
# The script is sourced (not executed) so its functions are available without
# running a command or loading /etc/wg-forge/config.conf — this works because
# the dispatch block at the bottom of wg-forge is guarded by a
# "${BASH_SOURCE[0]}" == "${0}" check.
#
# Run with:  bats test/

setup() {
  source "${BATS_TEST_DIRNAME}/../wg-forge"
}

# ── bytes_to_human ──────────────────────────────────────────────

@test "bytes_to_human: zero and small byte counts" {
  [ "$(bytes_to_human 0)" = "0B" ]
  [ "$(bytes_to_human 512)" = "512B" ]
}

@test "bytes_to_human: defaults to 0B with no argument" {
  [ "$(bytes_to_human)" = "0B" ]
}

@test "bytes_to_human: KB / MB / GB boundaries" {
  [ "$(bytes_to_human 1024)" = "1.00KB" ]
  [ "$(bytes_to_human 1048576)" = "1.00MB" ]
  [ "$(bytes_to_human 1073741824)" = "1.00GB" ]
}

@test "bytes_to_human: fractional GB" {
  [ "$(bytes_to_human 1610612736)" = "1.50GB" ]
}

# ── human_to_bytes ──────────────────────────────────────────────

@test "human_to_bytes: GB / MB / KB units" {
  [ "$(human_to_bytes 10GB)" = "10737418240" ]
  [ "$(human_to_bytes 500MB)" = "524288000" ]
  [ "$(human_to_bytes 1KB)" = "1024" ]
}

@test "human_to_bytes: fractional value" {
  [ "$(human_to_bytes 1.5GB)" = "1610612736" ]
}

@test "human_to_bytes: case-insensitive units" {
  [ "$(human_to_bytes 10gb)" = "10737418240" ]
}

@test "human_to_bytes: bare number treated as bytes" {
  [ "$(human_to_bytes 2048)" = "2048" ]
}

# ── human_to_bytes ↔ bytes_to_human round-trip ──────────────────

@test "round-trip: 10GB -> bytes -> 10.00GB" {
  local b
  b=$(human_to_bytes 10GB)
  [ "$(bytes_to_human "$b")" = "10.00GB" ]
}

# ── handshake_age (date stubbed for determinism) ────────────────

@test "handshake_age: 0 means never" {
  [ "$(handshake_age 0)" = "never" ]
}

@test "handshake_age: seconds, minutes, hours buckets" {
  date() { echo 1000000; }   # freeze "now"
  [ "$(handshake_age 999970)" = "30s ago" ]   # 30 seconds
  [ "$(handshake_age 999400)" = "10m ago" ]   # 600 seconds
  [ "$(handshake_age 996400)" = "1h ago" ]    # 3600 seconds
}

# ── duration_to_seconds ─────────────────────────────────────────

@test "duration_to_seconds: weeks / days / hours / minutes" {
  [ "$(duration_to_seconds 2w)" = "1209600" ]   # 2 * 604800
  [ "$(duration_to_seconds 30d)" = "2592000" ]   # 30 * 86400
  [ "$(duration_to_seconds 12h)" = "43200" ]     # 12 * 3600
  [ "$(duration_to_seconds 90m)" = "5400" ]      # 90 * 60
}

@test "duration_to_seconds: case-insensitive units" {
  [ "$(duration_to_seconds 30D)" = "2592000" ]
}

@test "duration_to_seconds: bare number treated as seconds" {
  [ "$(duration_to_seconds 3600)" = "3600" ]
}

@test "duration_to_seconds: empty / non-numeric yields 0" {
  [ "$(duration_to_seconds '')" = "0" ]
  [ "$(duration_to_seconds never)" = "0" ]
}

# ── expiry_remaining (date stubbed for determinism) ─────────────

@test "expiry_remaining: 0 / empty means never" {
  [ "$(expiry_remaining 0)" = "never" ]
  [ "$(expiry_remaining '')" = "never" ]
}

@test "expiry_remaining: past timestamp is expired" {
  date() { echo 1000000; }   # freeze "now"
  [ "$(expiry_remaining 999999)" = "expired" ]   # 1s in the past
  [ "$(expiry_remaining 1000000)" = "expired" ]  # exactly now
}

@test "expiry_remaining: minutes / hours / days buckets" {
  date() { echo 1000000; }   # freeze "now"
  [ "$(expiry_remaining 1000600)" = "10m left" ]    # +600s
  [ "$(expiry_remaining 1003600)" = "1h left" ]     # +3600s
  [ "$(expiry_remaining 1086400)" = "1d left" ]     # +86400s
}

# ── next_ip ─────────────────────────────────────────────────────

@test "next_ip: first client when registry is empty" {
  WG_SUBNET="10.99.0"
  CLIENTS_FILE="$BATS_TEST_TMPDIR/clients.conf"
  printf '# wg-forge data\n' > "$CLIENTS_FILE"
  [ "$(next_ip)" = "10.99.0.3" ]
}

@test "next_ip: increments past the highest octet (numeric, not lexical sort)" {
  WG_SUBNET="10.99.0"
  CLIENTS_FILE="$BATS_TEST_TMPDIR/clients.conf"
  cat > "$CLIENTS_FILE" <<'EOF'
# wg-forge data
alice:PUBA:10.99.0.3/32
bob:PUBB:10.99.0.10/32
carol:PUBC:10.99.0.4/32
EOF
  # Highest is .10 (numeric), so next must be .11 — a lexical sort would
  # wrongly pick .4 and return .5.
  [ "$(next_ip)" = "10.99.0.11" ]
}

# ── client_config (DNS is configurable) ─────────────────────────

@test "client_config: uses WG_DNS when set" {
  WG_DNS="1.1.1.1"
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  run client_config "CLIENTPRIV" "10.99.0.3"
  [[ "$output" == *"DNS = 1.1.1.1"* ]]
}

@test "client_config: falls back to 8.8.8.8 when WG_DNS is unset" {
  unset WG_DNS
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  run client_config "CLIENTPRIV" "10.99.0.3"
  [[ "$output" == *"DNS = 8.8.8.8"* ]]
}

@test "client_config: accepts multiple comma-separated DNS servers" {
  WG_DNS="1.1.1.1, 1.0.0.1"
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  run client_config "CLIENTPRIV" "10.99.0.3"
  [[ "$output" == *"DNS = 1.1.1.1, 1.0.0.1"* ]]
}

@test "client_config: normalizes the address to a single /32" {
  WG_DNS="8.8.8.8"
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  # Whether the caller passes a bare IP or one already carrying /32,
  # the rendered config must contain exactly one /32 suffix.
  run client_config "CLIENTPRIV" "10.99.0.3/32"
  [[ "$output" == *"Address = 10.99.0.3/32"* ]]
  [[ "$output" != *"/32/32"* ]]
}

# ── client_config (AllowedIPs / split tunnel is configurable) ───

@test "client_config: defaults to full tunnel when WG_ALLOWED_IPS is unset" {
  unset WG_ALLOWED_IPS
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  run client_config "CLIENTPRIV" "10.99.0.3"
  [[ "$output" == *"AllowedIPs = 0.0.0.0/0"* ]]
}

@test "client_config: uses WG_ALLOWED_IPS for a split tunnel when set" {
  WG_ALLOWED_IPS="10.0.0.0/8"
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  run client_config "CLIENTPRIV" "10.99.0.3"
  [[ "$output" == *"AllowedIPs = 10.0.0.0/8"* ]]
  [[ "$output" != *"AllowedIPs = 0.0.0.0/0"* ]]
}

@test "client_config: accepts multiple comma-separated routes" {
  WG_ALLOWED_IPS="10.0.0.0/8, 192.168.1.0/24"
  VPS_PUBKEY="SRVPUB"
  VPS_ENDPOINT="1.2.3.4:51820"
  run client_config "CLIENTPRIV" "10.99.0.3"
  [[ "$output" == *"AllowedIPs = 10.0.0.0/8, 192.168.1.0/24"* ]]
}
