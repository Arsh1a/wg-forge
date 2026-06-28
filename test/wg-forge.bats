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
