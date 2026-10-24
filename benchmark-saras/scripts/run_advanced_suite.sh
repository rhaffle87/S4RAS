#!/bin/bash
# ==============================================================================
# S4RAS Advanced Multi-Tier Concurrency Benchmark Suite
# Node: VM 209 (Benchmark Node)
# Engine: Apache JMeter 5.6.3 & SIP Trunk Runner
# ==============================================================================

set -e

JMETER_HOME="${JMETER_HOME:-/home/admin-node/apache-jmeter-5.6.3}"
SCENARIO_DIR="${SCENARIO_DIR:-/home/admin-node/apache-jmeter-5.6.3/bin}"
OUTPUT_BASE_DIR="/home/admin-node/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "${OUTPUT_BASE_DIR}"

run_jmeter_plan() {
    local TIER_NAME="$1"
    local PLAN_NAME="$2"
    local THREADS="$3"
    local RAMPUP="$4"
    local LOOPS="$5"
    local DURATION="${6:-}"

    local PLAN_FILE="${SCENARIO_DIR}/${PLAN_NAME}.jmx"
    local RESULT_DIR="${OUTPUT_BASE_DIR}/${TIMESTAMP}_${TIER_NAME}_${PLAN_NAME}"
    local LOG_FILE="${RESULT_DIR}/jmeter.log"
    local JTL_FILE="${RESULT_DIR}/results.jtl"
    local REPORT_DIR="${RESULT_DIR}/html_report"

    if [ ! -f "${PLAN_FILE}" ]; then
        echo "[WARN] Plan file ${PLAN_FILE} not found. Skipping."
        return 1
    fi

    echo "---------------------------------------------------------"
    echo "[BENCHMARK] Executing ${TIER_NAME} -> ${PLAN_NAME}"
    echo "Threads: ${THREADS}, Rampup: ${RAMPUP}s, Loops: ${LOOPS}, Duration: ${DURATION}s"
    echo "Output: ${RESULT_DIR}"
    echo "---------------------------------------------------------"

    mkdir -p "${RESULT_DIR}"

    local EXTRA_ARGS=""
    if [ -n "${DURATION}" ] && [ "${DURATION}" != "0" ]; then
        EXTRA_ARGS="-Jduration=${DURATION}"
    fi

    "${JMETER_HOME}/bin/jmeter" \
        -n \
        -t "${PLAN_FILE}" \
        -Jthreads="${THREADS}" \
        -Jrampup="${RAMPUP}" \
        -Jloops="${LOOPS}" \
        ${EXTRA_ARGS} \
        -l "${JTL_FILE}" \
        -j "${LOG_FILE}" \
        -e \
        -o "${REPORT_DIR}"

    echo "[COMPLETED] ${TIER_NAME} -> ${PLAN_NAME}"
    echo "Report: ${REPORT_DIR}/index.html"
}

run_tier1_peak() {
    echo "=========================================================="
    echo ">>> TIER 1: REALISTIC CAMPUS PEAK LOAD BENCHMARK <<<"
    echo "=========================================================="
    run_jmeter_plan "tier1_peak" "keycloak_token_load" 500 30 10
    run_jmeter_plan "tier1_peak" "nextcloud_webdav_load" 100 15 5
    run_jmeter_plan "tier1_peak" "moodle_login" 100 20 5
    if [ -f "/home/admin-node/voip_sip_trunk_benchmark.sh" ]; then
        echo "[VOIP] Running SIP Trunk Concurrency (20 calls)..."
        CALL_CONCURRENCY=20 TIMESTAMP="${TIMESTAMP}" bash /home/admin-node/voip_sip_trunk_benchmark.sh || true
    fi
}

run_tier2_stress() {
    echo "=========================================================="
    echo ">>> TIER 2: SATURATION & STRESS LOAD BENCHMARK <<<"
    echo "=========================================================="
    run_jmeter_plan "tier2_stress" "keycloak_token_load" 1000 20 10
    run_jmeter_plan "tier2_stress" "nextcloud_webdav_load" 250 15 5
    run_jmeter_plan "tier2_stress" "moodle_login" 250 20 5
    if [ -f "/home/admin-node/voip_sip_trunk_benchmark.sh" ]; then
        echo "[VOIP] Running SIP Trunk Stress (50 calls)..."
        CALL_CONCURRENCY=50 TIMESTAMP="${TIMESTAMP}" bash /home/admin-node/voip_sip_trunk_benchmark.sh || true
    fi
}

run_tier3_soak() {
    echo "=========================================================="
    echo ">>> TIER 3: ENDURANCE SOAK TEST (300 SECONDS SUSTAINED) <<<"
    echo "=========================================================="
    run_jmeter_plan "tier3_soak" "keycloak_token_load" 100 10 100 300
    run_jmeter_plan "tier3_soak" "nextcloud_webdav_load" 50 10 50 300
    run_jmeter_plan "tier3_soak" "moodle_login" 50 10 50 300
}

TARGET_TIER="${1:-all}"

case "${TARGET_TIER}" in
    tier1|peak)
        run_tier1_peak
        ;;
    tier2|stress)
        run_tier2_stress
        ;;
    tier3|soak)
        run_tier3_soak
        ;;
    all)
        run_tier1_peak
        run_tier2_stress
        run_tier3_soak
        ;;
    *)
        echo "Unknown target tier: ${TARGET_TIER}. Options: tier1, tier2, tier3, all"
        exit 1
        ;;
esac

echo "=========================================================="
echo "ALL ADVANCED BENCHMARK RUNS FINISHED SUCCESSFULLY!"
echo "Reports stored in: ${OUTPUT_BASE_DIR}"
echo "=========================================================="
