const express = require('express');
const { spawn } = require('child_process');
const crypto = require('crypto');

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const app = express();
const PORT = process.env.DEPLOY_SERVER_PORT || 4000;
const TOKEN = process.env.DEPLOY_TOKEN;
const ALLOWED_ORIGIN = process.env.DEPLOY_ALLOWED_ORIGIN || null;

if (!TOKEN || TOKEN === 'changeme') {
  console.warn('[SECURITY WARNING] DEPLOY_TOKEN is unset or using insecure default. /deploy requests will be rejected.');
}

app.use(express.json());

// Restrict CORS to a configured origin for the admin UI.
app.use((req, res, next) => {
  if (ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Deploy-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/status', (req, res) => {
  res.json({ status: 'ok', service: 'deploy-trigger' });
});

app.post('/deploy', (req, res) => {
  const incoming = req.headers['x-deploy-token'] || req.headers['x-deploy-token'.toLowerCase()];
  if (!TOKEN || TOKEN === 'changeme' || !incoming || !safeCompare(incoming, TOKEN)) {
    return res.status(401).json({ error: 'unauthorized', message: 'Valid DEPLOY_TOKEN required' });
  }

  // Run deploy script
  const sh = spawn('sh', ['./scripts/deploy.sh'], { env: process.env });

  let output = '';
  sh.stdout.on('data', (data) => {
    output += data.toString();
  });
  sh.stderr.on('data', (data) => {
    output += data.toString();
  });
  sh.on('close', (code) => {
    res.json({ exitCode: code, output });
  });
});

app.listen(PORT, () => {
  console.log(`Deploy trigger listening on port ${PORT}`);
});
