#!/bin/bash
# ==============================================================================
# S4RAS GitHub Actions Self-Hosted Runner Setup Script
# Node: VM 208 (Portal & Gateway)
# User: portal (/home/portal/actions-runner)
# ==============================================================================

set -e

RUNNER_DIR="/home/portal/actions-runner"
RUNNER_VERSION="2.321.0"
REPO_URL="https://github.com/rhaffle87/s4ras"

echo "=========================================================="
echo "S4RAS GitHub Actions Self-Hosted Runner Provisioner"
echo "Target Node: VM 208 (Portal Production)"
echo "Directory: ${RUNNER_DIR}"
echo "=========================================================="

mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

if [ ! -f "config.sh" ]; then
    echo "[1/4] Downloading GitHub Actions Runner v${RUNNER_VERSION}..."
    curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
        https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
    
    echo "[2/4] Extracting installer..."
    tar xzf ./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
    rm -f actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz
fi

echo "[3/4] Installing system dependencies..."
if [ -f "bin/installdependencies.sh" ]; then
    sudo ./bin/installdependencies.sh
fi

echo "[4/4] Runner binaries prepared."
echo "----------------------------------------------------------"
echo "To register this runner with GitHub, obtain a registration token from:"
echo "https://github.com/rhaffle87/s4ras/settings/actions/runners/new"
echo "Then execute inside VM 208 (${RUNNER_DIR}):"
echo "./config.sh --url ${REPO_URL} --token <REGISTRATION_TOKEN> --name vm208-portal --labels s4ras-portal --unattended --replace"
echo "sudo ./svc.sh install portal"
echo "sudo ./svc.sh start"
echo "=========================================================="
