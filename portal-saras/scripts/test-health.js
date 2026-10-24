#!/usr/bin/env node

/**
 * test-health.js — S4RAS Ecosystem Health & Connectivity Probe
 * Tests all registered microservices via the Portal BFF Health API.
 */

const https = require('https');

const SERVICES = ['moodle', 'sso', 'cloud', 'iptv', 'dispatcharr', 'jellyseerr', 'voip', 'monitor', 'status', 'benchmark'];
const BASE_URL = process.env.PORTAL_HEALTH_URL || 'https://portal.s4ras.site/api/health';

function probeService(key) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}/${key}`;
    const req = https.get(url, { rejectUnauthorized: false, timeout: 6000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ key, success: true, ...json });
        } catch (e) {
          resolve({ key, success: false, status: 'parse_error', message: data });
        }
      });
    });

    req.on('error', (err) => resolve({ key, success: false, status: 'error', message: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ key, success: false, status: 'timeout' }); });
  });
}

function fetchAllHealth() {
  return new Promise((resolve) => {
    const url = `${BASE_URL}/all`;
    const req = https.get(url, { rejectUnauthorized: false, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  console.log('====================================================');
  console.log('  S4RAS Ecosystem Health & Connectivity Checker');
  console.log(`  Probing Portal Gateway: ${BASE_URL}`);
  console.log('====================================================\n');

  const allData = await fetchAllHealth();
  let passed = 0;

  if (allData && allData.services) {
    for (const svc of SERVICES) {
      const res = allData.services[svc];
      const isOnline = res && res.status === 'online';
      if (isOnline) passed++;

      const badge = isOnline ? '[PASS] [ONLINE]' : '[FAIL] [OFFLINE]';
      const latency = res && res.latency != null ? `(${res.latency}ms)` : '';
      console.log(`${badge} ${svc.padEnd(10)} -> ${res ? res.message : 'No data'} ${latency}`);
    }
  } else {
    for (const svc of SERVICES) {
      const res = await probeService(svc);
      const isOnline = res.status === 'online';
      if (isOnline) passed++;

      const badge = isOnline ? '[PASS] [ONLINE]' : '[FAIL] [OFFLINE]';
      const latency = res.latency ? `(${res.latency}ms)` : '';
      console.log(`${badge} ${svc.padEnd(10)} -> ${res.message || ''} ${latency}`);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Summary: ${passed}/${SERVICES.length} services online ${allData ? `(Batch probe: ${allData.durationMs}ms)` : ''}`);
  console.log('----------------------------------------------------\n');

  if (passed === SERVICES.length) {
    console.log('All microservices are operational.');
    process.exit(0);
  } else {
    console.warn('Warning: Some microservices did not report online.');
    process.exit(1);
  }
}

main();
