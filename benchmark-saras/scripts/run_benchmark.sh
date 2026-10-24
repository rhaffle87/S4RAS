#!/bin/bash
# ==============================================================================
# S4RAS Enterprise Performance Benchmark Runner
# Node: VM 209 (Benchmark Node)
# Engine: Apache JMeter 5.6.3 (Headless Non-GUI Execution) & VoIP Latency Runner
# ==============================================================================

set -e

JMETER_HOME="${JMETER_HOME:-/home/admin-node/apache-jmeter-5.6.3}"
SCENARIO_DIR="${JMETER_HOME}/bin"
OUTPUT_BASE_DIR="/home/admin-node/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

SCENARIO="${1:-all}"

if [ ! -f "${JMETER_HOME}/bin/jmeter" ]; then
    echo "[ERROR] JMeter binary not found at ${JMETER_HOME}/bin/jmeter"
    exit 1
fi

mkdir -p "${OUTPUT_BASE_DIR}"

run_scenario() {
    local PLAN_NAME="$1"
    local PLAN_FILE="${SCENARIO_DIR}/${PLAN_NAME}.jmx"
    local RESULT_DIR="${OUTPUT_BASE_DIR}/${TIMESTAMP}_${PLAN_NAME}"
    local LOG_FILE="${RESULT_DIR}/jmeter.log"
    local JTL_FILE="${RESULT_DIR}/results.jtl"
    local REPORT_DIR="${RESULT_DIR}/html_report"

    if [ ! -f "${PLAN_FILE}" ]; then
        echo "[WARN] Scenario file ${PLAN_FILE} not found. Skipping."
        return 1
    fi

    echo "=========================================================="
    echo "Starting S4RAS Benchmark Scenario: ${PLAN_NAME}"
    echo "Timestamp: ${TIMESTAMP}"
    echo "Target Plan: ${PLAN_FILE}"
    echo "Output Dir: ${RESULT_DIR}"
    echo "=========================================================="

    mkdir -p "${RESULT_DIR}"

    "${JMETER_HOME}/bin/jmeter" \
        -n \
        -t "${PLAN_FILE}" \
        -l "${JTL_FILE}" \
        -j "${LOG_FILE}" \
        -e \
        -o "${REPORT_DIR}"

    echo ""
    echo "[SUCCESS] Benchmark completed for ${PLAN_NAME}!"
    echo "HTML Report generated at: ${REPORT_DIR}/index.html"
    echo "Raw Metrics log at: ${JTL_FILE}"
    echo "=========================================================="
}

run_voip() {
    if [ -f "/home/admin-node/voip_sip_trunk_benchmark.sh" ]; then
        TIMESTAMP="${TIMESTAMP}" bash /home/admin-node/voip_sip_trunk_benchmark.sh
    fi
}

if [ "${SCENARIO}" == "all" ]; then
    echo "Running S4RAS Full Ecosystem Multi-Service Benchmark Suite..."
    run_scenario "keycloak_token_load" || true
    run_scenario "nextcloud_webdav_load" || true
    run_scenario "moodle_login" || true
    run_voip || true
elif [ "${SCENARIO}" == "voip" ]; then
    run_voip
else
    run_scenario "${SCENARIO}"
fi
