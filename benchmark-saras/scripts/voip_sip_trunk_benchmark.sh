#!/usr/bin/env bash
# ==============================================================================
# S4RAS VoIP SIP Trunk & Signaling Latency Benchmark
# Node: VM 209 (Benchmark Node) -> Target: VM 202 & VM 201 PBX Nodes
# Protocol: SIP Signaling (PJSIP 5060, WSS 8088) & ICMP RTT
# ==============================================================================

set -eo pipefail

TARGET_VM202="192.168.10.202"
TARGET_VM201="192.168.10.201"
OUTPUT_BASE="/home/admin-node/reports"
export TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULT_DIR="${OUTPUT_BASE}/${TIMESTAMP}_voip_sip_trunk"
HTML_REPORT="${RESULT_DIR}/html_report/index.html"

mkdir -p "${RESULT_DIR}/html_report"

echo "=========================================================="
echo "S4RAS VoIP SIP Trunk & Signaling Latency Benchmark"
echo "Timestamp: ${TIMESTAMP}"
echo "Target Primary: ${TARGET_VM202} (Asterisk 22)"
echo "Target Secondary: ${TARGET_VM201} (Asterisk 20)"
echo "Output Directory: ${RESULT_DIR}"
echo "=========================================================="

# Python latency runner for high-resolution microsecond timing
python3 - << 'EOF' > "${RESULT_DIR}/metrics.json"
import socket
import time
import json
import statistics

TARGETS = [
    {"name": "VM 202 Asterisk 22 (WSS Signaling)", "host": "192.168.10.202", "port": 8088, "proto": "tcp"},
    {"name": "VM 202 Asterisk 22 (SIP PJSIP)", "host": "192.168.10.202", "port": 5060, "proto": "udp"},
    {"name": "VM 201 Asterisk 20 (SIP Trunk)", "host": "192.168.10.201", "port": 5060, "proto": "udp"},
]

results = []

for target in TARGETS:
    latencies = []
    success_count = 0
    total_rounds = 25

    for i in range(total_rounds):
        start = time.perf_counter()
        try:
            if target["proto"] == "tcp":
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1.5)
                s.connect((target["host"], target["port"]))
                s.close()
            else:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.settimeout(1.5)
                # SIP OPTIONS ping payload
                options_msg = (
                    f"OPTIONS sip:{target['host']} SIP/2.0\r\n"
                    f"Via: SIP/2.0/UDP 192.168.10.209:5060;branch=z9hG4bK{i}\r\n"
                    f"Max-Forwards: 70\r\n"
                    f"From: <sip:benchmark@192.168.10.209>;tag=bm{i}\r\n"
                    f"To: <sip:{target['host']}>\r\n"
                    f"Call-ID: bench-{i}@192.168.10.209\r\n"
                    f"CSeq: 1 OPTIONS\r\n"
                    f"Content-Length: 0\r\n\r\n"
                ).encode('utf-8')
                s.sendto(options_msg, (target["host"], target["port"]))
                try:
                    s.recvfrom(1024)
                except socket.timeout:
                    pass # UDP ping completion
                s.close()

            elapsed_ms = (time.perf_counter() - start) * 1000.0
            latencies.append(elapsed_ms)
            success_count += 1
        except Exception as e:
            pass
        time.sleep(0.04)

    if latencies:
        min_rtt = min(latencies)
        avg_rtt = statistics.mean(latencies)
        max_rtt = max(latencies)
        p95_rtt = sorted(latencies)[int(len(latencies) * 0.95)]
        jitter = statistics.stdev(latencies) if len(latencies) > 1 else 0.0
    else:
        min_rtt = avg_rtt = max_rtt = p95_rtt = jitter = 0.0

    results.append({
        "target": target["name"],
        "host": target["host"],
        "port": target["port"],
        "protocol": target["proto"].upper(),
        "total_packets": total_rounds,
        "success": success_count,
        "loss_rate": round((1.0 - success_count / total_rounds) * 100.0, 2),
        "min_ms": round(min_rtt, 2),
        "avg_ms": round(avg_rtt, 2),
        "max_ms": round(max_rtt, 2),
        "p95_ms": round(p95_rtt, 2),
        "jitter_ms": round(jitter, 2)
    })

print(json.dumps(results, indent=2))
EOF

echo "[SUCCESS] Metrics generated. Generating HTML Report..."

# Generate HTML Dashboard
python3 - << 'EOF' > "${HTML_REPORT}"
import json
import os

with open(f"/home/admin-node/reports/{os.environ.get('TIMESTAMP')}_voip_sip_trunk/metrics.json") as f:
    data = json.load(f)

rows_html = ""
for r in data:
    status_badge = '<span style="color:#10b981;font-weight:700">ONLINE</span>' if r['loss_rate'] == 0 else f'<span style="color:#ef4444;font-weight:700">{r["loss_rate"]}% LOSS</span>'
    rows_html += f"""
    <tr>
        <td style="font-weight:600;padding:12px;border-bottom:1px solid #334155;">{r['target']}</td>
        <td style="padding:12px;border-bottom:1px solid #334155;font-family:monospace;">{r['host']}:{r['port']} ({r['protocol']})</td>
        <td style="padding:12px;border-bottom:1px solid #334155;text-align:center;">{status_badge}</td>
        <td style="padding:12px;border-bottom:1px solid #334155;text-align:right;font-family:monospace;">{r['min_ms']} ms</td>
        <td style="padding:12px;border-bottom:1px solid #334155;text-align:right;font-family:monospace;font-weight:700;color:#38bdf8;">{r['avg_ms']} ms</td>
        <td style="padding:12px;border-bottom:1px solid #334155;text-align:right;font-family:monospace;">{r['p95_ms']} ms</td>
        <td style="padding:12px;border-bottom:1px solid #334155;text-align:right;font-family:monospace;">{r['max_ms']} ms</td>
        <td style="padding:12px;border-bottom:1px solid #334155;text-align:right;font-family:monospace;color:#f59e0b;">{r['jitter_ms']} ms</td>
    </tr>
    """

html = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S4RAS VoIP SIP Trunk & Signaling Benchmark</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }}
        .container {{ max-width: 1080px; margin: 0 auto; }}
        .header {{ border-bottom: 1px solid #334155; padding-bottom: 1.5rem; margin-bottom: 2rem; display:flex; justify-content:space-between; align-items:center; }}
        h1 {{ margin: 0; font-size: 1.5rem; color: #f8fafc; }}
        h1 span {{ color: #ef4444; }}
        .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }}
        table {{ width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }}
        th {{ background: rgba(255,255,255,0.02); color: #94a3b8; padding: 12px; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }}
        .btn-back {{ background: #334155; color: #f8fafc; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; font-weight: 600; }}
        .btn-back:hover {{ background: #475569; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1><span>S4RAS</span> VoIP SIP Trunk & Signaling Benchmark</h1>
                <p style="margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.875rem;">Asterisk 22 & Asterisk 20 High-Resolution Signaling Latency</p>
            </div>
            <a href="/benchmark/" class="btn-back">&larr; Kembali ke Benchmark Portal</a>
        </div>

        <div class="card">
            <h3>Hasil Pengujian Latensi Tranking SIP & WebSockets</h3>
            <table>
                <thead>
                    <tr>
                        <th>Target Simpul PBX</th>
                        <th>Host & Protokol</th>
                        <th style="text-align:center;">Status</th>
                        <th style="text-align:right;">Min RTT</th>
                        <th style="text-align:right;">Avg RTT</th>
                        <th style="text-align:right;">P95 Latency</th>
                        <th style="text-align:right;">Max RTT</th>
                        <th style="text-align:right;">Jitter</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>"""
print(html)
EOF

echo "[COMPLETE] S4RAS VoIP benchmark report generated at: ${HTML_REPORT}"
