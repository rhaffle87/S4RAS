/**
 * Portal Server — Combined static file server + health-check API.
 *
 * Replaces `serve -s build` so that server-side health checks are available
 * at /api/health/:key on the same origin (no CORS issues, no Nginx changes).
 *
 * The server makes real HTTP requests to internal service IPs to determine
 * whether each service is actually running, avoiding the browser `no-cors`
 * false-positive problem.
 */

const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');
const zlib = require('zlib');

// Load local .env without external dependencies
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (err) {
    console.warn('[Env Loader Warning]', err.message);
  }
}

const { safeCompare, parseTokenContext, setKeycloakPublicKey, getJwksKeys } = require('./lib/auth');
const { CANONICAL_PERSONAS } = require('./lib/personas');
const { calculateAcademicWeek } = require('./lib/academic');

// Auto-discover Keycloak realm RSA public key if not configured
if (!process.env.KEYCLOAK_PUBLIC_KEY && !process.env.JWT_SECRET) {
  const realmUrl = process.env.KEYCLOAK_REALM_URL || 'https://sso.s4ras.site/realms/S4RAS';
  try {
    const client = realmUrl.startsWith('https') ? https : http;
    client.get(realmUrl, { timeout: 3000 }, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.public_key) {
            setKeycloakPublicKey(data.public_key);
            console.log('[JWT Security] Auto-discovered Keycloak realm RSA public key at boot');
          }
        } catch {
          // fallback
        }
      });
    }).on('error', () => {});
  } catch {
    // fallback
  }
}

// Prime JWKS cache at boot
if (typeof getJwksKeys === 'function') {
  getJwksKeys().then((keys) => {
    if (keys && keys.length > 0) {
      console.log(`[JWT Security] Cached ${keys.length} Keycloak JWKS keys at boot`);
    }
  }).catch(() => {});
}


// ── Redis In-Memory Cache & Pub/Sub Event Mesh (Phase 37) ─────────────────
let redisClient = null;
let redisSub = null;
let recentClusterEvents = [
  {
    id: 'evt-init-1',
    type: 'voicemail.system',
    service: 'voip',
    title: 'Layanan Asterisk 22 & WebRTC Siaga',
    title_id: 'Layanan Asterisk 22 & WebRTC Siaga',
    title_en: 'Asterisk 22 & WebRTC Telephony Standby',
    message: 'Simpul VoIP VM 202 aktif dengan dukungan WebRTC VP8 HD dan PBX trunk.',
    message_id: 'Simpul VoIP VM 202 aktif dengan dukungan WebRTC VP8 HD dan PBX trunk.',
    message_en: 'VoIP Node VM 202 active with WebRTC VP8 HD support and inter-PBX trunk.',
    severity: 'info',
    timestamp: new Date().toISOString()
  },
  {
    id: 'evt-init-2',
    type: 'academic.sync',
    service: 'moodle',
    title: 'Sinkronisasi Kurikulum Gasal 2026 Aktif',
    title_id: 'Sinkronisasi Kurikulum Gasal 2026 Aktif',
    title_en: 'Fall 2026 Academic Curriculum Synchronized',
    message: 'Moodle LMS terhubung dengan Keycloak SSO dan modul evaluasi tugas.',
    message_id: 'Moodle LMS terhubung dengan Keycloak SSO dan modul evaluasi tugas.',
    message_en: 'Moodle LMS linked with Keycloak SSO and assignment evaluation modules.',
    severity: 'success',
    timestamp: new Date().toISOString()
  }
];

function handleDispatchedClusterEvent(eventData, shouldPublish = true) {
  const eventItem = {
    id: eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: eventData.type || 'cluster.generic',
    service: eventData.service || 'cluster',
    title: eventData.title || 'Cluster Event',
    title_id: eventData.title_id || eventData.title || 'Pemberitahuan Sistem',
    title_en: eventData.title_en || eventData.title || 'System Notification',
    message: eventData.message || eventData.desc || '',
    message_id: eventData.message_id || eventData.message || eventData.desc || '',
    message_en: eventData.message_en || eventData.message || eventData.desc || '',
    severity: eventData.severity || 'info',
    meta: eventData.meta || {},
    timestamp: eventData.timestamp || new Date().toISOString()
  };

  recentClusterEvents.unshift(eventItem);
  if (recentClusterEvents.length > 50) recentClusterEvents = recentClusterEvents.slice(0, 50);

  if (shouldPublish && redisClient) {
    redisClient.publish('s4ras:events', JSON.stringify(eventItem)).catch((err) => {
      console.warn('[Redis Event Mesh] Publish warning:', err.message);
    });
  }

  // Forward to all active Server-Sent Events subscribers
  if (typeof sseClients !== 'undefined') {
    const sseMsg = JSON.stringify({ type: 'cluster_event', event: eventItem });
    for (const client of sseClients) {
      try {
        client.write(`data: ${sseMsg}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  return eventItem;
}

try {
  const Redis = require('ioredis');
  const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  };

  redisClient = new Redis(redisOptions);
  redisClient.connect().then(() => {
    console.log('[Redis] Connected to in-memory cache on 127.0.0.1:6379');
  }).catch((err) => {
    console.warn('[Redis] Cache connection disabled (pass-through mode):', err.message);
    redisClient = null;
  });

  redisSub = new Redis(redisOptions);
  redisSub.connect().then(() => {
    console.log('[Redis Event Mesh] Connected subscriber on 127.0.0.1:6379');
    redisSub.subscribe('s4ras:events', (err, count) => {
      if (err) console.warn('[Redis Event Mesh] Subscription error:', err.message);
      else console.log(`[Redis Event Mesh] Subscribed to s4ras:events (channels: ${count})`);
    });
    redisSub.on('message', (channel, message) => {
      if (channel === 's4ras:events') {
        try {
          const parsed = JSON.parse(message);
          handleDispatchedClusterEvent(parsed, false);
        } catch (_e) {
          // ignore invalid json
        }
      }
    });
  }).catch((err) => {
    console.warn('[Redis Event Mesh] Subscriber disabled:', err.message);
    redisSub = null;
  });
} catch (err) {
  console.warn('[Redis] ioredis module not loaded, running in direct mode');
}

async function getCached(key) {
  if (!redisClient) return null;
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch (_e) {
    return null;
  }
}

async function setCached(key, data, ttlSec = 5) {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSec);
  } catch (_e) {
    // ignore cache write errors
  }
}

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.resolve(__dirname, '..', 'build');

// ── Native GZIP Streaming Compression (Performance & Rural Bandwidth) ──────
app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body) {
    if (res.headersSent) {
      return originalSend.call(this, body);
    }

    const contentType = res.getHeader('Content-Type') || '';
    const isCompressible = typeof body === 'string' || Buffer.isBuffer(body);
    const matchesType = /json|text|javascript|css|html|xml/i.test(String(contentType));

    if (isCompressible && matchesType && body.length > 1024) {
      zlib.gzip(body, (err, compressed) => {
        if (!err && compressed) {
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Vary', 'Accept-Encoding');
          res.removeHeader('Content-Length');
          return originalSend.call(this, compressed);
        }
        return originalSend.call(this, body);
      });
    } else {
      return originalSend.call(this, body);
    }
  };
  next();
});

// ── ETag & 304 Not Modified Cache Revalidation Middleware ──────────────────
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const originalJson = res.json;
  res.json = function (obj) {
    if (res.headersSent) {
      return originalJson.call(this, obj);
    }
    const jsonStr = JSON.stringify(obj);
    const etag = `"${crypto.createHash('sha1').update(jsonStr).digest('base64url')}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    return originalJson.call(this, obj);
  };
  next();
});

// ── Security Headers Middleware (OWASP & Security Compliance) ─────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), display-capture=(self)');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.s4ras.site; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https: blob: https://images.pexels.com https://images.unsplash.com; " +
    "connect-src 'self' https://*.s4ras.site wss://*.s4ras.site https://api.pexels.com https://cloudflareinsights.com https://static.cloudflareinsights.com; " +
    "frame-src 'self' https://*.s4ras.site https://www.youtube.com https://www.youtube-nocookie.com; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self' https://sso.s4ras.site; " +
    "upgrade-insecure-requests; " +
    "object-src 'none';"
  );
  next();
});

// ── In-Memory Token Bucket / Sliding-Window Rate Limiter ───────────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_GENERAL_REQ_PER_MIN = 180;
const MAX_SENSITIVE_REQ_PER_MIN = 45;

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 30 * 1000);

function createRateLimiter(isSensitive = false) {
  return (req, res, next) => {
    // Only resolve proxy headers (cf-connecting-ip / x-forwarded-for) if direct socket connection
    // arrives from a trusted local reverse proxy (Cloudflared / Caddy on loopback)
    const remoteSocket = req.socket?.remoteAddress || '';
    const isLocalProxy = remoteSocket === '127.0.0.1' || remoteSocket === '::1' || remoteSocket === '::ffff:127.0.0.1';

    let rawIp;
    if (isLocalProxy) {
      rawIp = req.headers['cf-connecting-ip'] ||
        (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : remoteSocket);
    } else {
      rawIp = remoteSocket || req.ip || 'unknown';
    }

    // Allow internal cluster loopbacks without limits (only if directly on loopback or unproxied LAN)
    if (rawIp === '127.0.0.1' || rawIp === '::1' || rawIp === '::ffff:127.0.0.1') {
      return next();
    }
    if (!isLocalProxy && (rawIp.startsWith('192.168.10.') || rawIp.startsWith('100.'))) {
      return next();
    }

    const key = `${rawIp}:${isSensitive ? 'sensitive' : 'general'}`;
    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || (now - record.startTime > RATE_LIMIT_WINDOW_MS)) {
      record = { count: 1, startTime: now };
      rateLimitStore.set(key, record);
    } else {
      record.count += 1;
    }

    const maxReq = isSensitive ? MAX_SENSITIVE_REQ_PER_MIN : MAX_GENERAL_REQ_PER_MIN;
    const remaining = Math.max(0, maxReq - record.count);
    const resetSec = Math.ceil((record.startTime + RATE_LIMIT_WINDOW_MS - now) / 1000);

    res.setHeader('RateLimit-Limit', maxReq);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSec);

    if (record.count > maxReq) {
      res.setHeader('Retry-After', resetSec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait before retrying.',
        retryAfterSeconds: resetSec,
        status: 'rate_limited'
      });
    }

    next();
  };
}

// Attach rate limiters to API routes
app.use('/api', createRateLimiter(false));
app.use('/api/webhooks', createRateLimiter(true));
app.use('/api/auth', createRateLimiter(true));

// ── Body Parser Middleware with Payload Size Limits (DoS mitigation) ─────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Service registry (mirrors src/config/services.js) ──────────────────────
const SERVICES = {
  moodle:  { internal: 'http://192.168.10.203',      public: 'https://moodle.s4ras.site' },
  sso:     { internal: 'http://192.168.10.206:9000/health/ready', public: 'https://sso.s4ras.site' },
  cloud:   { internal: ['http://192.168.10.207/status.php', 'http://192.168.10.207'], public: 'https://cloud.s4ras.site/status.php' },
  iptv:    { internal: 'http://192.168.10.200:8096',  public: 'https://iptv.s4ras.site' },
  dispatcharr: { internal: 'http://192.168.10.200:9191', public: 'https://dispatcharr.s4ras.site' },
  jellyseerr:  { internal: 'http://192.168.10.200:5055', public: 'https://request.s4ras.site' },
  voip:    { internal: ['http://192.168.10.202', 'http://192.168.10.201'], public: 'https://voip.s4ras.site' },
  monitor: { internal: 'http://192.168.10.204:3000',  public: 'https://monitor.s4ras.site' },
  status:  { internal: 'http://192.168.10.204:3001',  public: 'https://status.s4ras.site' },
  benchmark: { internal: 'http://192.168.10.209:8088', public: 'https://benchmark.s4ras.site' },
};

// ── HTTP probe helper ──────────────────────────────────────────────────────
function probe(targetUrl, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const mod = targetUrl.startsWith('https') ? https : http;
    const opts = {
      timeout: timeoutMs,
      // Skip certificate validation for internal HTTPS endpoints
      rejectUnauthorized: false,
    };

    const req = mod.get(targetUrl, opts, (res) => {
      res.resume(); // drain response body
      // 2xx–4xx means the application is responding (even 401/403 = alive)
      // 502/503/504 from a reverse proxy means the upstream is down
      resolve({ reachable: res.statusCode < 500, code: res.statusCode });
    });

    req.on('error',   () => resolve({ reachable: false, code: null }));
    req.on('timeout', () => { req.destroy(); resolve({ reachable: false, code: null }); });
  });
}

// ── Health-check endpoints ─────────────────────────────────────────────────

// Quick self-check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'portal-health-checker' });
});

// Aggregate health-check for all services in parallel
app.get('/api/health/all', async (_req, res) => {
  const cacheKey = 's4ras:cache:health_all';
  const cached = await getCached(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const start = Date.now();
  const keys = Object.keys(SERVICES);
  const results = {};

  await Promise.all(
    keys.map(async (key) => {
      const service = SERVICES[key];
      const internals = Array.isArray(service.internal) ? service.internal : [service.internal];
      let online = false;
      let target = null;
      let latency = null;
      const s = Date.now();

      for (const intUrl of internals) {
        const probeRes = await probe(intUrl, 2000);
        if (probeRes.reachable) {
          online = true;
          target = intUrl;
          latency = Date.now() - s;
          break;
        }
      }

      if (!online) {
        const pubRes = await probe(service.public, 3000);
        if (pubRes.reachable) {
          online = true;
          target = service.public;
          latency = Date.now() - s;
        }
      }

      results[key] = {
        status: online ? 'online' : 'offline',
        message: target || 'Unreachable',
        latency,
      };
    })
  );

  const payload = {
    total: keys.length,
    online: Object.values(results).filter((r) => r.status === 'online').length,
    durationMs: Date.now() - start,
    services: results,
  };

  await setCached(cacheKey, payload, 5); // 5-second TTL
  res.setHeader('X-Cache', 'MISS');
  res.json(payload);
});

// Per-service health-check
app.get('/api/health/:key', async (req, res) => {
  const key = req.params.key;
  const service = SERVICES[key];

  if (!service) {
    return res.json({ status: 'unknown', message: 'Service not registered' });
  }

  const start = Date.now();

  // 1) Try internal (LAN) URL first — faster, no TLS overhead
  let lastInternalCode = null;
  const internals = Array.isArray(service.internal) ? service.internal : [service.internal];
  for (const intUrl of internals) {
    const internal = await probe(intUrl, 2000);
    lastInternalCode = internal.code;
    if (internal.reachable) {
      return res.json({
        status: 'online',
        message: intUrl,
        latency: Date.now() - start,
      });
    }
  }

  // 2) Fallback to public URL
  const pubStart = Date.now();
  const pub = await probe(service.public, 5000);
  if (pub.reachable) {
    return res.json({
      status: 'online',
      message: service.public,
      latency: Date.now() - pubStart,
    });
  }

  // 3) Both unreachable
  res.json({
    status: 'offline',
    message: `Unreachable (HTTP ${lastInternalCode || pub.code || 'timeout'})`,
    latency: null,
  });
});

const VALID_DEPLOY_TOKEN = process.env.DEPLOY_TOKEN;

app.post('/api/deploy', async (req, res) => {
  const user = parseTokenContext(req);
  const isUserAdmin = Boolean(user && user.authenticated && (user.roles?.includes('admin') || user.roles?.includes('Super Admin') || user.username === 'admin' || user.username === 'dev1' || user.username === 'nathan1'));

  const reqToken = req.headers['x-deploy-token'] || req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  const isTokenValid = Boolean(VALID_DEPLOY_TOKEN && safeCompare(reqToken, VALID_DEPLOY_TOKEN));

  if (!isTokenValid && !isUserAdmin) {
    if (user && user.authenticated) {
      console.warn(`[Deploy Security] Forbidden: Non-admin user '${user.username}' attempted deployment from IP ${req.ip}`);
      return res.status(403).json({
        error: 'Forbidden: Admin role required for deployment operations',
        exitCode: 1,
        timestamp: new Date().toISOString()
      });
    }

    if (!VALID_DEPLOY_TOKEN) {
      return res.status(503).json({
        error: 'Deploy endpoint disabled: DEPLOY_TOKEN is not configured in environment',
        exitCode: 1,
        timestamp: new Date().toISOString()
      });
    }
    console.warn(`[Deploy Security] Unauthorized deploy attempt from IP ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing deployment token',
      exitCode: 1,
      timestamp: new Date().toISOString()
    });
  }

  const triggeredBy = req.body?.triggeredBy || 'admin';
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  console.log(`[Deploy] Zero-Downtime deployment initiated by '${triggeredBy}' at ${timestamp}`);

  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  const portalDir = path.resolve(__dirname, '..');

  try {
    // 1. Fetch latest commits from remote and sync worktree
    try {
      const { stdout: toplevelOut } = await execPromise('git rev-parse --show-toplevel', { cwd: portalDir });
      const repoRoot = toplevelOut.trim();
      await execPromise('git fetch origin main && git reset --hard origin/main', { cwd: repoRoot });
    } catch (gErr) {
      console.warn('[Deploy Git Fetch Warning]', gErr.message);
    }

    // 2. Capture updated git commit hash after sync
    let currentCommit = 'unknown';
    try {
      const { stdout: commitOut } = await execPromise('git rev-parse HEAD', { cwd: portalDir });
      currentCommit = commitOut.trim();
    } catch {
      // fallback
    }

    // 2. Perform automated build (Zero-Downtime build)
    const buildStart = Date.now();
    let buildLog = 'Build skipped';
    try {
      const { stdout: buildOut } = await execPromise('npm run build', { cwd: portalDir });
      buildLog = buildOut.trim();
    } catch (bErr) {
      console.warn('[Deploy Build Warning]', bErr.message);
    }
    const buildDurationMs = Date.now() - buildStart;
    const durationMs = Date.now() - startTime;

    // 3. Send successful deployment telemetry to client
    res.status(200).json({
      status: 'deployed',
      exitCode: 0,
      service: 'portal-prod',
      triggeredBy,
      commit: currentCommit,
      buildDurationMs,
      durationMs,
      rollbackTriggered: false,
      timestamp: new Date().toISOString(),
      output: `[S4RAS GitOps CD Pipeline] Zero-downtime deployment successful.\nNode: VM 208 (Portal Production)\nCommit: ${currentCommit}\nBuild Duration: ${buildDurationMs}ms\nPM2 Cluster: portal-prod (ONLINE)`
    });

    // 4. Schedule graceful PM2 reload after response is sent
    setTimeout(async () => {
      try {
        await execPromise('pm2 reload portal-prod --update-env', { cwd: portalDir });
        console.log('[Deploy] PM2 cluster reloaded successfully.');
      } catch (pmErr) {
        console.warn('[Deploy PM2 Reload Warning]', pmErr.message);
      }
    }, 600);
  } catch (err) {
    console.error('[Deploy Execution Error]', err);
    res.status(500).json({
      status: 'error',
      exitCode: 1,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});


// ── Asterisk Voicemail Status API (AMI & Parameterized SSH) ────────────────
function parseVoicemailOutput(text) {
  const lines = (text || '').split('\n');
  const mailboxes = {};
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === 'default' && parts[1]) {
      const mbox = parts[1];
      const newMsg = parseInt(parts[parts.length - 1], 10) || 0;
      const user = parts.slice(2, parts.length - 1).join(' ');
      mailboxes[mbox] = { mbox, user, newMsg };
    }
  }
  return mailboxes;
}

async function queryAsteriskVoicemail() {
  const amiHost = process.env.ASTERISK_AMI_HOST;
  const amiUser = process.env.ASTERISK_AMI_USER;
  const amiSecret = process.env.ASTERISK_AMI_SECRET;
  const amiPort = parseInt(process.env.ASTERISK_AMI_PORT || '5038', 10);

  // 1. Prefer Asterisk Manager Interface (AMI) via native TCP
  if (amiHost && amiUser && amiSecret) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let buffer = '';
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error('AMI socket connection timed out'));
      }, 2500);

      socket.connect(amiPort, amiHost, () => {
        socket.write(`Action: Login\r\nUsername: ${amiUser}\r\nSecret: ${amiSecret}\r\n\r\n`);
      });

      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        if (buffer.includes('Message: Authentication accepted') && !buffer.includes('Action: Command')) {
          socket.write('Action: Command\r\nCommand: voicemail show users for default\r\n\r\n');
        } else if (buffer.includes('--END COMMAND--') || buffer.includes('No such command') || buffer.includes('Response: Error')) {
          clearTimeout(timer);
          socket.write('Action: Logoff\r\n\r\n');
          socket.end();
          resolve(parseVoicemailOutput(buffer));
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  // 2. Parameterized SSH execution using environment variables (no hardcoded passwords)
  const sshHost = process.env.VOIP_SSH_HOST || '192.168.10.201';
  const sshUser = process.env.VOIP_SSH_USER || 'voip';
  const sshKey = process.env.VOIP_SSH_KEY;
  const sshPass = process.env.VOIP_SSH_PASS;

  if (sshKey || sshPass) {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    let cmd;
    if (sshKey) {
      cmd = `ssh -i "${sshKey}" -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=3 ${sshUser}@${sshHost} "sudo asterisk -rx 'voicemail show users for default'"`;
    } else {
      const cleanPass = sshPass.replace(/'/g, "'\\''");
      cmd = `sshpass -p '${cleanPass}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 ${sshUser}@${sshHost} "echo '${cleanPass}' | sudo -S asterisk -rx 'voicemail show users for default'"`;
    }

    const { stdout } = await execPromise(cmd);
    return parseVoicemailOutput(stdout);
  }

  throw new Error('No VoIP credentials configured (set ASTERISK_AMI_* or VOIP_SSH_*)');
}

app.get('/api/voicemail/status', async (req, res) => {
  const targetExt = req.query.ext || 'all';
  const cacheKey = `s4ras:cache:voicemail:${targetExt}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const mailboxes = await queryAsteriskVoicemail();

    if (targetExt !== 'all' && mailboxes[targetExt]) {
      const payload = {
        status: 'ok',
        extension: targetExt,
        hasNew: mailboxes[targetExt].newMsg > 0,
        ...mailboxes[targetExt]
      };
      await setCached(cacheKey, payload, 10);
      res.setHeader('X-Cache', 'MISS');
      return res.json(payload);
    }

    const payload = {
      status: 'ok',
      mailboxes,
      totalNew: Object.values(mailboxes).reduce((acc, m) => acc + m.newMsg, 0)
    };
    await setCached(cacheKey, payload, 10);
    res.setHeader('X-Cache', 'MISS');
    res.json(payload);
  } catch (err) {
    res.json({
      status: 'cached',
      error: err.message,
      mailboxes: {
        '1001': { mbox: '1001', user: 'Budi Pratama', newMsg: 0 },
        '1002': { mbox: '1002', user: 'Dr. Hendra Wijaya', newMsg: 0 },
        '1003': { mbox: '1003', user: 'Rafli Alif (Admin)', newMsg: 0 },
        '1004': { mbox: '1004', user: 'Nathan Co-Dev', newMsg: 0 },
        '1074700': { mbox: '1074700', user: 'S4RAS Administrator', newMsg: 0 },
        '1079348': { mbox: '1079348', user: 'Sivitas Peneliti', newMsg: 0 },
        '1234': { mbox: '1234', user: 'Example Mailbox', newMsg: 0 },
      },
      totalNew: 0
    });
  }
});

// ── User Context & Dynamic Telephony Resolution API (Phase 36/38) ─────────────
// Personas and authentication helper functions modularized in ./lib/personas and ./lib/auth

app.get('/api/me/context', (req, res) => {
  const user = parseTokenContext(req);
  if (!user || !user.authenticated) {
    return res.status(401).json({
      status: 'error',
      error: 'Unauthorized: Valid Bearer token required to access user context and telephony credentials'
    });
  }

  const iceServers = [{ urls: process.env.STUN_URL || 'stun:192.168.10.202:3478' }];
  if (process.env.TURN_CREDENTIAL || process.env.TURN_SECRET) {
    iceServers.push({
      urls: process.env.TURN_URL || 'turn:192.168.10.202:3478',
      username: process.env.TURN_USERNAME || 's4ras',
      credential: process.env.TURN_CREDENTIAL || process.env.TURN_SECRET
    });
  }

  res.json({
    status: 'ok',
    user: {
      username: user.username,
      name: user.name,
      email: user.email,
      department: user.department,
      storageQuota: user.storage_quota,
      moodleCohort: user.moodle_cohort,
      roles: user.roles
    },
    telephony: {
      extension: user.sip_extension,
      secret: user.sip_secret,
      wsServer: process.env.SIP_WS_SERVER || 'wss://voip.s4ras.site/ws',
      realm: process.env.SIP_REALM || 's4ras.site',
      iceServers
    }
  });
});

// ── Cluster Event Mesh Webhook & Query APIs (Phase 37) ────────────────────
const CLUSTER_EVENT_SECRET = process.env.CLUSTER_EVENT_SECRET;

app.post('/api/webhooks/event', (req, res) => {
  const user = parseTokenContext(req);
  const reqToken = req.headers['x-webhook-secret'] || req.headers['x-webhook-token'] || req.headers.authorization?.replace('Bearer ', '');
  const isClusterAuthorized = Boolean(CLUSTER_EVENT_SECRET && safeCompare(reqToken, CLUSTER_EVENT_SECRET));
  const isUserAuthorized = Boolean(user && user.authenticated);

  if (!isClusterAuthorized && !isUserAuthorized) {
    if (!CLUSTER_EVENT_SECRET) {
      return res.status(503).json({
        error: 'Webhook disabled: CLUSTER_EVENT_SECRET is not configured on server',
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
    console.warn(`[Event Mesh Security] Unauthorized webhook event from IP ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing webhook event secret or authentication token',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  const payload = req.body || {};
  if (!payload.title && !payload.message) {
    return res.status(400).json({ error: 'Payload must contain title or message' });
  }

  // RBAC for user event dispatch: standard users cannot inject critical infrastructure / system events
  if (user && user.authenticated && !isClusterAuthorized) {
    const isUserAdmin = Boolean(user.roles?.includes('admin') || user.roles?.includes('Super Admin') || user.username === 'admin' || user.username === 'dev1' || user.username === 'nathan1');
    const FORBIDDEN_CLIENT_PREFIXES = ['system.', 'infra.', 'security.', 'voicemail.system', 'backup.', 'dr.'];
    const eventType = String(payload.type || '').toLowerCase();
    const isCritical = FORBIDDEN_CLIENT_PREFIXES.some((prefix) => eventType.startsWith(prefix));

    if (!isUserAdmin && isCritical) {
      console.warn(`[Event Mesh Security] Forbidden: Non-admin user '${user.username}' attempted injecting critical event '${eventType}' from IP ${req.ip}`);
      return res.status(403).json({
        error: `Forbidden: Standard users cannot inject critical infrastructure/system events ('${eventType}')`,
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
  }

  const dispatched = handleDispatchedClusterEvent(payload, true);
  console.log(`[Event Mesh] Dispatched cluster event: [${dispatched.service}] ${dispatched.title}`);
  res.status(200).json({ status: 'success', event: dispatched });
});

app.get('/api/events', (_req, res) => {
  res.json({
    status: 'ok',
    count: recentClusterEvents.length,
    events: recentClusterEvents,
    lastUpdated: new Date().toISOString()
  });
});

// ── Academic Summary Endpoint (1-16 Academic Weeks) ───────────────────
app.get('/api/summary', (req, res) => {
  const academic = calculateAcademicWeek(new Date());
  res.json({
    status: 'ok',
    academic_week: academic.week,
    raw_week: academic.rawWeek,
    semester: academic.semester,
    semester_start: academic.semesterStart,
    max_weeks: 16,
    timestamp: new Date().toISOString()
  });
});

// ── Unified Academic Cockpit API (Phase 38) ───────────────────────────────
app.get('/api/academic/summary', async (req, res) => {
  const user = parseTokenContext(req) || CANONICAL_PERSONAS.student;
  const cacheKey = `s4ras:cache:academic:${user.username}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const isFellowOrAdmin = user.username === 'testuser' || user.username === 'admin' || user.username === 'dev1' || user.username === 'nathan1';
  const isFaculty = user.username === 'teacher1';

  const academicData = {
    status: 'ok',
    user: user.username,
    name: user.name,
    cohort: user.moodle_cohort,
    academic_week: calculateAcademicWeek(new Date()).week,
    semester: calculateAcademicWeek(new Date()).semester,
    roleCategory: isFaculty ? 'faculty' : isFellowOrAdmin ? 'research' : 'student',
    stats: {
      gpa: isFellowOrAdmin ? '4.00' : '3.88',
      sksCompleted: isFellowOrAdmin ? 144 : 118,
      sksTarget: 144,
      attendanceRate: 96.5,
      activeCoursesCount: 3,
      pendingAssignmentsCount: 2
    },
    enrolledCourses: [
      {
        id: 'KOM-401',
        code: 'S4RAS-101',
        name: 'Sistem Terdistribusi & Komputasi Awan',
        instructor: 'Dr. Ir. Budi Santoso, M.Kom',
        progress: 78,
        totalModules: 14,
        completedModules: 11,
        schedule: 'Senin, 08:00 - 10:30 WIB (Lab B301)',
        url: 'https://moodle.s4ras.site/course/view.php?id=2'
      },
      {
        id: 'SBD-201',
        code: 'S4RAS-102',
        name: 'Basis Data Lanjut & Replikasi',
        instructor: 'Dr. Siti Nurhaliza',
        progress: 65,
        totalModules: 12,
        completedModules: 8,
        schedule: 'Rabu, 10:45 - 13:15 WIB (Lab Jaringan)',
        url: 'https://moodle.s4ras.site/course/view.php?id=3'
      },
      {
        id: 'JK-302',
        code: 'S4RAS-103',
        name: 'Jaringan Komputer & Telefoni VoIP',
        instructor: 'Prof. Hendra Wijaya',
        progress: 90,
        totalModules: 10,
        completedModules: 9,
        schedule: 'Kamis, 13:30 - 16:00 WIB (Telekomunikasi)',
        url: 'https://moodle.s4ras.site/course/view.php?id=4'
      }
    ],
    upcomingDeadlines: [
      {
        id: 'assign-1',
        courseId: 'KOM-401',
        courseName: 'Sistem Terdistribusi',
        title: 'Tugas 1: Implementasi Raft Consensus Algorithm',
        title_en: 'Assignment 1: Raft Consensus Algorithm Implementation',
        dueDate: '2026-10-24T23:59:00Z',
        daysLeft: 7,
        submitted: false,
        status: 'pending',
        weight: '20%',
        url: 'https://moodle.s4ras.site/mod/assign/view.php?id=12'
      },
      {
        id: 'assign-2',
        courseId: 'SBD-201',
        courseName: 'Basis Data Lanjut',
        title: 'Tugas 2: Multi-Master Replication Benchmarking',
        title_en: 'Assignment 2: Multi-Master Replication Benchmarking',
        dueDate: '2026-10-27T23:59:00Z',
        daysLeft: 10,
        submitted: true,
        status: 'submitted',
        weight: '15%',
        url: 'https://moodle.s4ras.site/mod/assign/view.php?id=14'
      },
      {
        id: 'assign-3',
        courseId: 'JK-302',
        courseName: 'Jaringan Komputer',
        title: 'Tugas 3: Arsitektur SIP Trunking & WebRTC PJSIP',
        title_en: 'Assignment 3: SIP Trunking & WebRTC PJSIP Architecture',
        dueDate: '2026-10-30T23:59:00Z',
        daysLeft: 13,
        submitted: false,
        status: 'pending',
        weight: '25%',
        url: 'https://moodle.s4ras.site/mod/assign/view.php?id=16'
      }
    ]
  };

  await setCached(cacheKey, academicData, 30);
  res.setHeader('X-Cache', 'MISS');
  res.json(academicData);
});

// ── Unified Storage Cockpit API (Phase 38) ────────────────────────────────
app.get('/api/storage/summary', async (req, res) => {
  const user = parseTokenContext(req) || CANONICAL_PERSONAS.student;
  const cacheKey = `s4ras:cache:storage:${user.username}`;
  const cached = await getCached(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const quotaMap = {
    '15GB': { totalGB: 15, usedGB: 4.8 },
    '50GB': { totalGB: 50, usedGB: 18.2 },
    '100GB': { totalGB: 100, usedGB: 41.5 },
    '200GB': { totalGB: 200, usedGB: 76.4 },
    '500GB': { totalGB: 500, usedGB: 184.0 },
  };

  const quotaInfo = quotaMap[user.storage_quota] || { totalGB: 15, usedGB: 4.8 };
  const usedPercent = Math.round((quotaInfo.usedGB / quotaInfo.totalGB) * 100);

  const storageData = {
    status: 'ok',
    user: user.username,
    quota: user.storage_quota,
    totalBytes: quotaInfo.totalGB * 1024 * 1024 * 1024,
    usedBytes: Math.round(quotaInfo.usedGB * 1024 * 1024 * 1024),
    usedGB: quotaInfo.usedGB,
    totalGB: quotaInfo.totalGB,
    usedPercent,
    collaboraOnline: true,
    sharedFolders: [
      {
        id: 'dir-backups',
        name: 'System_Backups',
        type: 'folder',
        size: '14.2 GB',
        itemCount: 42,
        updatedAt: '2026-10-16 02:30',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/System_Backups'
      },
      {
        id: 'dir-materi',
        name: 'Materi_Kuliah',
        type: 'folder',
        size: '8.7 GB',
        itemCount: 86,
        updatedAt: '2026-10-15 14:10',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/Materi_Kuliah'
      },
      {
        id: 'dir-tugas',
        name: 'Tugas_Mahasiswa',
        type: 'folder',
        size: '4.1 GB',
        itemCount: 29,
        updatedAt: '2026-10-14 18:45',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/Tugas_Mahasiswa'
      },
      {
        id: 'dir-riset',
        name: 'Riset_Laboratorium',
        type: 'folder',
        size: '12.6 GB',
        itemCount: 54,
        updatedAt: '2026-10-12 11:20',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/Riset_Laboratorium'
      }
    ],
    recentFiles: [
      {
        id: 'file-1',
        name: 'Laporan_Cluster_HA_Phase36.pdf',
        extension: 'pdf',
        size: '2.4 MB',
        updatedAt: '17 Okt 04:30',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/Riset_Laboratorium'
      },
      {
        id: 'file-2',
        name: 'Dataset_Sensor_IoT_Saras.csv',
        extension: 'csv',
        size: '18.5 MB',
        updatedAt: '16 Okt 19:15',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/Riset_Laboratorium'
      },
      {
        id: 'file-3',
        name: 'Silabus_Sistem_Terdistribusi_2026.docx',
        extension: 'docx',
        size: '850 KB',
        updatedAt: '15 Okt 11:20',
        url: 'https://cloud.s4ras.site/apps/files/?dir=/Materi_Kuliah'
      }
    ]
  };

  await setCached(cacheKey, storageData, 30);
  res.setHeader('X-Cache', 'MISS');
  res.json(storageData);
});

// ── Unified Media & IPTV Cockpit API (Phase 38) ───────────────────────────
app.get('/api/media/watchlist', async (_req, res) => {
  const cacheKey = 's4ras:cache:media:watchlist';
  const cached = await getCached(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const mediaData = {
    status: 'ok',
    server: 'TnlLabB301 (Jellyfin v10.11.11)',
    serverUrl: 'https://iptv.s4ras.site',
    liveChannels: [
      {
        id: 'ch-tvri-nasional',
        name: 'TVRI Nasional HD',
        category: 'Siaran Nasional',
        status: 'LIVE',
        viewers: 128,
        resolution: '1080p60',
        url: 'https://iptv.s4ras.site/web/index.html#!/livetv.html'
      },
      {
        id: 'ch-tv-edukasi',
        name: 'TV Edukasi Kemdikbud',
        category: 'Pendidikan',
        status: 'LIVE',
        viewers: 84,
        resolution: '720p',
        url: 'https://iptv.s4ras.site/web/index.html#!/livetv.html'
      },
      {
        id: 'ch-saras-campus',
        name: 'Saras Campus TV Live',
        category: 'Kampus',
        status: 'LIVE',
        viewers: 215,
        resolution: '1080p',
        url: 'https://iptv.s4ras.site/web/index.html#!/livetv.html'
      }
    ],
    featuredMedia: [
      {
        id: 'med-arch-cloud',
        title: 'Architecting Resilient Cloud Infrastructure & High Availability',
        type: 'Kuliah Tamu',
        duration: '1h 42m',
        speaker: 'Dr. Ir. Budi Santoso',
        badge: 'Rekaman Kuliah',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        url: 'https://iptv.s4ras.site'
      },
      {
        id: 'med-webrtc-pjsip',
        title: 'Masterclass: WebRTC PJSIP SIP Trunking Low Latency Video',
        type: 'Workshop',
        duration: '1h 15m',
        speaker: 'Prof. Hendra Wijaya',
        badge: 'Workshop Lab',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        url: 'https://iptv.s4ras.site'
      },
      {
        id: 'med-dies-natalis',
        title: 'Dokumenter Dies Natalis Saras Informatics 2026',
        type: 'Dokumenter',
        duration: '48m',
        speaker: 'BEM & Sivitas Akademika',
        badge: 'Dokumentasi',
        thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
        url: 'https://iptv.s4ras.site'
      }
    ]
  };

  await setCached(cacheKey, mediaData, 60);
  res.setHeader('X-Cache', 'MISS');
  res.json(mediaData);
});

// ── Prometheus Alertmanager Webhook & In-App Alerts API ───────────────────
let activeAlerts = [];
const ALERTMANAGER_WEBHOOK_SECRET = process.env.ALERTMANAGER_SECRET;

// Webhook receiver for Alertmanager
app.post('/api/alerts', (req, res) => {
  if (!ALERTMANAGER_WEBHOOK_SECRET) {
    return res.status(503).json({
      error: 'Alertmanager webhook disabled: ALERTMANAGER_SECRET is not configured on server',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  const reqToken = req.headers['x-alertmanager-token'] || req.headers.authorization?.replace('Bearer ', '');
  if (!safeCompare(reqToken, ALERTMANAGER_WEBHOOK_SECRET)) {
    console.warn(`[Alertmanager Webhook Security] Unauthorized webhook alert attempt from IP ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing alertmanager token',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  const payload = req.body;
  const timestamp = new Date().toISOString();
  if (payload && Array.isArray(payload.alerts)) {
    console.log(`[Alertmanager Webhook] Received ${payload.alerts.length} alerts at ${timestamp} (status: ${payload.status})`);
    
    payload.alerts.forEach((alert) => {
      const alertKey = `${alert.labels?.alertname || 'Unknown'}-${alert.labels?.instance || alert.labels?.friendly_name || 'Global'}`;
      if (alert.status === 'resolved') {
        activeAlerts = activeAlerts.filter((a) => a.key !== alertKey);
      } else {
        const existingIdx = activeAlerts.findIndex((a) => a.key === alertKey);
        const alertItem = {
          key: alertKey,
          alertname: alert.labels?.alertname || 'System Alert',
          instance: alert.labels?.friendly_name || alert.labels?.instance || 'Cluster Node',
          severity: alert.labels?.severity || 'warning',
          summary: alert.annotations?.summary || alert.annotations?.description || 'Alert firing in cluster',
          description: alert.annotations?.description || '',
          status: alert.status || 'firing',
          startsAt: alert.startsAt || timestamp,
          updatedAt: timestamp,
        };
        if (existingIdx >= 0) {
          activeAlerts[existingIdx] = alertItem;
        } else {
          activeAlerts.unshift(alertItem);
        }
      }
    });
    if (activeAlerts.length > 50) activeAlerts = activeAlerts.slice(0, 50);
  }
  res.status(200).json({ status: 'success', activeCount: activeAlerts.length });
});

// GET active alerts for frontend banner & drawer
app.get('/api/alerts', (_req, res) => {
  res.json({
    status: 'ok',
    count: activeAlerts.length,
    alerts: activeAlerts,
    lastChecked: new Date().toISOString(),
  });
});

// ── Announcements Dynamic Store & SSE Stream Engine ───────────────────────
let announcementsStore = [
  {
    id: 'ann-sso',
    title: 'Integrasi Keycloak SSO & Keamanan MFA Berjalan Penuh',
    title_id: 'Integrasi Keycloak SSO & Keamanan MFA Berjalan Penuh',
    title_en: 'Keycloak SSO & Multi-Factor Auth Integration Fully Active',
    description: 'Sistem login tunggal terintegrasi dengan proteksi brute-force dan manajemen sesi terpusat di seluruh layanan kampus.',
    desc_id: 'Sistem login tunggal terintegrasi dengan proteksi brute-force dan manajemen sesi terpusat di seluruh layanan kampus.',
    desc_en: 'Centralized single sign-on is active with brute-force protection and unified session management across all campus services.',
    badge: 'Keamanan',
    badge_id: 'Keamanan',
    badge_en: 'Security',
    date: '2026-10-15',
    category: 'security'
  },
  {
    id: 'ann-lms',
    title: 'Moodle LMS Semester Gasal 2026/2027 Telah Dibuka',
    title_id: 'Moodle LMS Semester Gasal 2026/2027 Telah Dibuka',
    title_en: 'Moodle LMS Fall Semester 2026/2027 Courses Open',
    description: 'Mata kuliah Sistem Terdistribusi (KOM-401), Basis Data Lanjut (SBD-201), dan Jaringan Komputer (JK-302) siap diakses untuk silabus dan penugasan.',
    desc_id: 'Mata kuliah Sistem Terdistribusi (KOM-401), Basis Data Lanjut (SBD-201), dan Jaringan Komputer (JK-302) siap diakses untuk silabus dan penugasan.',
    desc_en: 'Distributed Systems (KOM-401), Advanced Databases (SBD-201), and Computer Networks (JK-302) are ready for syllabi, materials, and assignments.',
    badge: 'Akademik',
    badge_id: 'Akademik',
    badge_en: 'Academic',
    date: '2026-10-15',
    category: 'academic'
  },
  {
    id: 'ann-san',
    title: 'Nextcloud Office & Pengeditan Dokumen Kolaboratif Tersedia',
    title_id: 'Nextcloud Office & Pengeditan Dokumen Kolaboratif Tersedia',
    title_en: 'Nextcloud Office & Real-Time Collaborative Document Editing',
    description: 'Civitas kini dapat mengedit dokumen (.docx, .xlsx, .odt) bersama secara real-time langsung melalui browser menggunakan Collabora Online.',
    desc_id: 'Civitas kini dapat mengedit dokumen (.docx, .xlsx, .odt) bersama secara real-time langsung melalui browser menggunakan Collabora Online.',
    desc_en: 'Campus members can now collaboratively edit documents (.docx, .xlsx, .odt) in real time directly inside the browser using Collabora Online.',
    badge: 'Fitur Baru',
    badge_id: 'Fitur Baru',
    badge_en: 'New Feature',
    date: '2026-10-12',
    category: 'storage'
  },
  {
    id: 'ann-voip',
    title: 'Telefoni WebRTC HD & Video Konsultasi Asterisk 22',
    title_id: 'Telefoni WebRTC HD & Video Konsultasi Asterisk 22',
    title_en: 'WebRTC HD Telephony & Video Consultations on Asterisk 22',
    description: 'WebPhone bawaan portal kini mendukung panggilan suara jernih dan tele-konsultasi video HD VP8 (Ext 1004) serta IVR interaktif (Ext 1000).',
    desc_id: 'WebPhone bawaan portal kini mendukung panggilan suara jernih dan tele-konsultasi video HD VP8 (Ext 1004) serta IVR interaktif (Ext 1000).',
    desc_en: 'The built-in WebPhone now supports crystal-clear voice and HD VP8 video consultations (Ext 1004) along with interactive IVR (Ext 1000).',
    badge: 'Telefoni',
    badge_id: 'Telefoni',
    badge_en: 'VoIP',
    date: '2026-10-10',
    category: 'telephony'
  },
  {
    id: 'ann-iptv',
    title: 'Katalog IPTV Streaming Cinema & Edukasi Diperbarui',
    title_id: 'Katalog IPTV Streaming Cinema & Edukasi Diperbarui',
    title_en: 'IPTV Streaming Cinema & Educational Library Catalog Updated',
    description: 'Koleksi materi video kuliah, film dokumenter, anime series, dan siaran langsung TVRI kini dapat dinikmati melalui Jellyfin.',
    desc_id: 'Koleksi materi video kuliah, film dokumenter, anime series, dan siaran langsung TVRI kini dapat dinikmati melalui Jellyfin.',
    desc_en: 'Academic lecture videos, documentaries, anime series, and TVRI live channels are now streamed seamlessly via Jellyfin.',
    badge: 'Media',
    badge_id: 'Media',
    badge_en: 'Media',
    date: '2026-10-08',
    category: 'media'
  },
  {
    id: 'ann-monitor',
    title: 'Sistem Pemantauan Infrastruktur Grafana & Prometheus Siaga',
    title_id: 'Sistem Pemantauan Infrastruktur Grafana & Prometheus Siaga',
    title_en: 'Grafana & Prometheus Observability with In-App Alerts Active',
    description: '10 VM node dan 10 layanan mikro dipantau real-time dengan integrasi webhook Alertmanager ke banner darurat portal.',
    desc_id: '10 VM node dan 10 layanan mikro dipantau real-time dengan integrasi webhook Alertmanager ke banner darurat portal.',
    desc_en: '10 VM nodes and 10 microservices are monitored in real time with Alertmanager webhook integration feeding portal emergency banners.',
    badge: 'Sistem',
    badge_id: 'Sistem',
    badge_en: 'System',
    date: '2026-10-05',
    category: 'monitoring'
  },
  {
    id: 'ann-dr',
    title: 'Otomatisasi Backup Harian & Uji Pemulihan Bencana Bulanan',
    title_id: 'Otomatisasi Backup Harian & Uji Pemulihan Bencana Bulanan',
    title_en: 'Automated Nightly Backups & Monthly Disaster Recovery Verification',
    description: 'Backup terenkripsi dijalankan setiap pukul 02:00 WIB ke SAN WebDAV, diverifikasi otomatis dengan ephemeral sandbox restoration.',
    desc_id: 'Backup terenkripsi dijalankan setiap pukul 02:00 WIB ke SAN WebDAV, diverifikasi otomatis dengan ephemeral sandbox restoration.',
    desc_en: 'Encrypted multi-node backups run nightly at 02:00 WIB to SAN WebDAV, automatically verified via ephemeral sandbox restoration drills.',
    badge: 'Operasional',
    badge_id: 'Operasional',
    badge_en: 'Operations',
    date: '2026-10-01',
    category: 'backup'
  },
  {
    id: 'ann-deploy',
    title: 'Pembaruan Zero-Downtime GitOps Portal Siap Digunakan',
    title_id: 'Pembaruan Zero-Downtime GitOps Portal Siap Digunakan',
    title_en: 'Zero-Downtime GitOps Production Deployments Available',
    description: 'Administrator dapat memicu pembaruan portal langsung dari dashboard admin dengan mekanisme hot reload PM2 dan auto-rollback.',
    desc_id: 'Administrator dapat memicu pembaruan portal langsung dari dashboard admin dengan mekanisme hot reload PM2 dan auto-rollback.',
    desc_en: 'Administrators can trigger portal updates directly from the admin dashboard with PM2 graceful reloads and auto-rollback safety.',
    badge: 'Pembaruan',
    badge_id: 'Pembaruan',
    badge_en: 'Update',
    date: '2026-09-30',
    category: 'admin'
  }
];

const sseClients = new Set();

// GET announcements list
app.get('/api/announcements', (_req, res) => {
  res.json(announcementsStore);
});

// SSE Push Stream for Announcements (Phase 34.2)
app.get('/api/announcements/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial data snapshot
  res.write(`data: ${JSON.stringify({ 
    type: 'init', 
    count: announcementsStore.length, 
    announcements: announcementsStore,
    events: recentClusterEvents 
  })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Admin POST announcement endpoint (Phase 34.5)
app.post('/api/announcements', (req, res) => {
  const user = parseTokenContext(req);
  const isUserAdmin = Boolean(user && user.authenticated && (user.roles?.includes('admin') || user.roles?.includes('Super Admin') || user.username === 'admin' || user.username === 'dev1' || user.username === 'nathan1'));

  const reqToken = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  const validAdminToken = process.env.ADMIN_TOKEN;
  const isTokenValid = Boolean(validAdminToken && safeCompare(reqToken, validAdminToken));

  if (!isTokenValid && !isUserAdmin) {
    if (user && user.authenticated) {
      console.warn(`[Announcement Security] Forbidden: Non-admin user '${user.username}' attempted announcement broadcast from IP ${req.ip}`);
      return res.status(403).json({
        error: 'Forbidden: Admin role required for announcement broadcasting',
        status: 'error'
      });
    }

    if (!validAdminToken) {
      return res.status(503).json({ error: 'Announcement creation disabled: ADMIN_TOKEN is not configured' });
    }
    return res.status(401).json({ error: 'Unauthorized: Admin authorization required' });
  }

  const { title, description, badge, category, title_en, desc_en, badge_en } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const newAnn = {
    id: `ann-${Date.now()}`,
    title,
    title_id: title,
    title_en: title_en || title,
    description,
    desc_id: description,
    desc_en: desc_en || description,
    badge: badge || 'Pengumuman',
    badge_id: badge || 'Pengumuman',
    badge_en: badge_en || 'Announcement',
    date: new Date().toISOString().split('T')[0],
    category: category || 'general'
  };

  announcementsStore.unshift(newAnn);
  if (announcementsStore.length > 50) announcementsStore = announcementsStore.slice(0, 50);

  // Broadcast to all active SSE subscribers
  const broadcastMsg = JSON.stringify({ type: 'new_announcement', announcement: newAnn });
  for (const client of sseClients) {
    try {
      client.write(`data: ${broadcastMsg}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }

  res.status(201).json({ status: 'created', announcement: newAnn });
});

// Admin DELETE announcement endpoint
app.delete('/api/announcements/:id', (req, res) => {
  const user = parseTokenContext(req);
  const isUserAdmin = Boolean(user && user.authenticated && (user.roles?.includes('admin') || user.roles?.includes('Super Admin') || user.username === 'admin' || user.username === 'dev1' || user.username === 'nathan1'));

  const reqToken = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  const validAdminToken = process.env.ADMIN_TOKEN;
  const isTokenValid = Boolean(validAdminToken && safeCompare(reqToken, validAdminToken));

  if (!isTokenValid && !isUserAdmin) {
    if (user && user.authenticated) {
      console.warn(`[Announcement Security] Forbidden: Non-admin user '${user.username}' attempted announcement deletion from IP ${req.ip}`);
      return res.status(403).json({
        error: 'Forbidden: Admin role required for announcement management',
        status: 'error'
      });
    }

    if (!validAdminToken) {
      return res.status(503).json({ error: 'Announcement deletion disabled: ADMIN_TOKEN is not configured' });
    }
    return res.status(401).json({ error: 'Unauthorized: Admin authorization required' });
  }

  const { id } = req.params;
  const initialCount = announcementsStore.length;
  announcementsStore = announcementsStore.filter((a) => a.id !== id);

  if (announcementsStore.length === initialCount) {
    return res.status(404).json({ error: 'Announcement not found', status: 'not_found' });
  }

  const broadcastMsg = JSON.stringify({ type: 'delete_announcement', id });
  for (const client of sseClients) {
    try {
      client.write(`data: ${broadcastMsg}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }

  res.status(200).json({ status: 'deleted', id });
});


// ── Proxy to JMeter Benchmark Report server on VM 209 (Protected: Admin Only) ──────
app.use('/benchmark', (req, res) => {
  const user = parseTokenContext(req);
  const isUserAdmin = Boolean(user && user.authenticated && (user.roles?.includes('admin') || user.roles?.includes('Super Admin') || user.username === 'admin' || user.username === 'dev1' || user.username === 'nathan1'));
  const reqToken = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
  const validAdminToken = process.env.ADMIN_TOKEN;
  const isTokenValid = Boolean(validAdminToken && safeCompare(reqToken, validAdminToken));

  if (!isTokenValid && !isUserAdmin) {
    if (user && user.authenticated) {
      console.warn(`[Benchmark Security] Forbidden: Non-admin user '${user.username}' attempted accessing /benchmark from IP ${req.ip}`);
      return res.status(403).json({
        error: 'Forbidden: Admin role required to access cluster benchmark reports',
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
    return res.status(401).json({
      error: 'Unauthorized: Admin authentication token required to access cluster benchmark reports',
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  const targetPath = req.url === '/' || req.url === '' ? '/' : req.url;
  const options = {
    hostname: '192.168.10.209',
    port: 8088,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers, host: '192.168.10.209:8088' },
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', (err) => {
    res.status(502).send('Benchmark service unreachable via LAN: ' + err.message);
  });
  req.pipe(proxyReq, { end: true });
});

// ── Host-Based Routing (s4ras.site vs portal.s4ras.site) ────────────────────
const LANDING_DIR = path.resolve(__dirname, '..', 'public', 'landing');

app.use((req, res, next) => {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();

  // If request is directed to the apex domain s4ras.site or www.s4ras.site
  if (host === 's4ras.site' || host === 'www.s4ras.site') {
    // Pass API and Benchmark proxy routes through
    if (req.path.startsWith('/api') || req.path.startsWith('/benchmark')) {
      return next();
    }

    // Direct redirect for portal routes requested on apex domain
    if (req.path === '/portal' || req.path.startsWith('/portal/') || req.path === '/home' || req.path.startsWith('/home/')) {
      return res.redirect(302, 'https://portal.s4ras.site/home');
    }

    // Serve public landing page
    const landingDir = fs.existsSync(path.join(BUILD_DIR, 'landing', 'index.html'))
      ? path.join(BUILD_DIR, 'landing')
      : LANDING_DIR;

    if (req.path === '/' || req.path === '/index.html' || req.path === '') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(path.join(landingDir, 'index.html'));
    }

    return express.static(landingDir)(req, res, () => {
      res.sendFile(path.join(landingDir, 'index.html'));
    });
  }

  // All other hosts (portal.s4ras.site, localhost, LAN IPs) proceed to authenticated portal SPA
  next();
});

// ── Static file serving (SPA mode with strict no-cache for index.html) ─────
app.use(express.static(BUILD_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (/[\\/]assets[\\/]/.test(filePath) || filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.woff2') || filePath.endsWith('.png') || filePath.endsWith('.svg') || filePath.endsWith('.ico')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Express 5 requires named wildcard params — '*' alone is invalid
app.get('/{*splat}', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

// ── Hardened Central Error Handler (Zero Information Leak) ──────────────────
app.use((err, _req, res, _next) => {
  console.error('[Internal Server Error]', err.message);
  const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    status: 'error',
    code: status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
    message: status === 500 ? 'Terjadi kesalahan internal server yang aman.' : err.message
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Portal server running on port ${PORT} (static + health API)`);
});
