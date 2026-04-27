#!/bin/bash
# wg-forge installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Arsh1a/wg-forge/main/install.sh | sudo bash

set -e

REPO="Arsh1a/wg-forge"
REF="${1:-main}"
BASE_URL="https://raw.githubusercontent.com/$REPO/$REF"

echo "╔══════════════════════════════╗"
echo "║    wg-forge  Installer       ║"
echo "╚══════════════════════════════╝"
echo ""

[ "$EUID" -ne 0 ] && echo "✗ Run as root" && exit 1

install_deps() {
    local PKGS=("$@")
    if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq && apt-get install -y "${PKGS[@]}"
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y "${PKGS[@]}"
    elif command -v yum >/dev/null 2>&1; then
        yum install -y "${PKGS[@]}"
    elif command -v pacman >/dev/null 2>&1; then
        pacman -Sy --noconfirm "${PKGS[@]}"
    else
        echo "✗ Could not install packages — unsupported package manager"
        echo "  Please install manually: ${PKGS[*]}"
        exit 1
    fi
}

MISSING=()
command -v wg     >/dev/null 2>&1 || MISSING+=(wireguard-tools)
command -v perl   >/dev/null 2>&1 || MISSING+=(perl)
command -v bc     >/dev/null 2>&1 || MISSING+=(bc)
command -v curl   >/dev/null 2>&1 || MISSING+=(curl)

if [ ${#MISSING[@]} -gt 0 ]; then
    echo "Installing missing dependencies: ${MISSING[*]}"
    install_deps "${MISSING[@]}"
    echo ""
fi

install_node() {
    if command -v node >/dev/null 2>&1; then return; fi
    echo "Installing Node.js..."
    NODE_VERSION="20.14.0"
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
        | tar -xz -C /usr/local --strip-components=1
    echo "✓ Node.js $(node -v) installed"
}

echo "Downloading wg-forge..."
curl -fsSL "$BASE_URL/wg-forge"                         -o /usr/local/bin/wg-forge
curl -fsSL "$BASE_URL/wg-forge-tracker"                 -o /usr/local/bin/wg-forge-tracker
curl -fsSL "$BASE_URL/wg-forge-tracker.service"         -o /tmp/wg-forge-tracker.service
curl -fsSL "$BASE_URL/wg-forge-checklimits.service"     -o /tmp/wg-forge-checklimits.service
curl -fsSL "$BASE_URL/wg-forge-checklimits.timer"       -o /tmp/wg-forge-checklimits.timer

chmod 755 /usr/local/bin/wg-forge
chmod 755 /usr/local/bin/wg-forge-tracker
mkdir -p /etc/wg-forge

if [ -d /etc/systemd/system ]; then
    install -m 644 /tmp/wg-forge-tracker.service     /etc/systemd/system/wg-forge-tracker.service
    install -m 644 /tmp/wg-forge-checklimits.service /etc/systemd/system/wg-forge-checklimits.service
    install -m 644 /tmp/wg-forge-checklimits.timer   /etc/systemd/system/wg-forge-checklimits.timer
    rm -f /tmp/wg-forge-tracker.service /tmp/wg-forge-checklimits.service /tmp/wg-forge-checklimits.timer
    systemctl daemon-reload
    # Install web service unit (not started yet — wg-forge setup does that)
    curl -fsSL "$BASE_URL/wg-forge-web.service" -o /etc/systemd/system/wg-forge-web.service
    systemctl enable --now wg-forge-tracker
    systemctl enable --now wg-forge-checklimits.timer
    echo "✓ wg-forge-tracker service enabled and started"
    echo "✓ wg-forge-checklimits timer enabled (runs every 30 seconds)"
else
    echo "✗ systemd not found — start wg-forge checklimits manually via cron"
fi

# Install Node.js and build web app
install_node
echo "Building web dashboard..."
REPO_TMP=$(mktemp -d)
curl -fsSL "https://api.github.com/repos/$REPO/tarball/$REF" -o "$REPO_TMP/repo.tar.gz"
tar -xzf "$REPO_TMP/repo.tar.gz" -C "$REPO_TMP"
rm -rf /opt/wg-forge-web
mv "$REPO_TMP"/*/web /opt/wg-forge-web
rm -rf "$REPO_TMP"
cd /opt/wg-forge-web && npm install --silent && npm run build
echo "✓ Web dashboard built"

echo "✓ wg-forge installed"
echo ""
echo "Next: sudo wg-forge setup"
