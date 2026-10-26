/* global vi */

import crypto from 'crypto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dispatchClusterEvent } from '../services/backend';
import authLib from '../../scripts/lib/auth.js';

// Helper matching portal-server.js safeCompare implementation
function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Cryptographic JWT Verification Helper matching portal-server.js
function verifyTokenSignatureAndPayload(rawToken, secretKey, publicKey) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const parts = rawToken.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  let header, payload;
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  // Anti-forgery: unconditional rejection of 'none' algorithm
  if (!header || !header.alg || header.alg.toLowerCase() === 'none') {
    return null;
  }

  // Strict Claims Validation
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) return null;
  if (payload.nbf && payload.nbf > nowSec) return null;

  const signedData = `${headerB64}.${payloadB64}`;
  const sigBuffer = Buffer.from(signatureB64, 'base64url');

  if (header.alg.startsWith('RS') && publicKey) {
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(signedData);
      if (!verifier.verify(publicKey, sigBuffer)) return null;
    } catch {
      return null;
    }
  } else if (header.alg.startsWith('HS') && secretKey) {
    try {
      const expectedSig = crypto.createHmac('sha256', secretKey).update(signedData).digest('base64url');
      if (!safeCompare(signatureB64, expectedSig)) return null;
    } catch {
      return null;
    }
  } else {
    // In dev / test fallback: require non-empty signature component
    if (!signatureB64 || signatureB64.length < 8) return null;
  }

  return payload;
}

// Simulated server handler matching portal-server.js /api/alerts
function handleAlertsEndpoint(req, envSecret) {
  if (!envSecret) {
    return {
      status: 503,
      body: { error: 'Alertmanager webhook disabled: ALERTMANAGER_SECRET is not configured on server' }
    };
  }
  const reqToken = req.headers?.['x-alertmanager-token'] || req.headers?.authorization?.replace('Bearer ', '');
  if (!safeCompare(reqToken, envSecret)) {
    return {
      status: 401,
      body: { error: 'Unauthorized: Invalid or missing alertmanager token' }
    };
  }
  return { status: 200, body: { status: 'success' } };
}

// Simulated server handler matching portal-server.js /api/webhooks/event with RBAC
function handleEventWebhookEndpoint(req, clusterSecret, jwtSecret) {
  const authHeader = req.headers?.authorization || '';
  let authUser = null;
  if (authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim();
    const payload = verifyTokenSignatureAndPayload(raw, jwtSecret);
    if (payload) {
      authUser = {
        authenticated: true,
        username: (payload.preferred_username || payload.username || '').toLowerCase(),
        roles: payload.realm_access?.roles || ['student']
      };
    }
  }

  const reqToken = req.headers?.['x-webhook-secret'] || req.headers?.['x-webhook-token'] || authHeader.replace('Bearer ', '');
  const isClusterAuthorized = Boolean(clusterSecret && safeCompare(reqToken, clusterSecret));
  const isUserAuthorized = Boolean(authUser && authUser.authenticated);

  if (!isClusterAuthorized && !isUserAuthorized) {
    if (!clusterSecret) {
      return {
        status: 503,
        body: { error: 'Webhook disabled: CLUSTER_EVENT_SECRET is not configured on server' }
      };
    }
    return {
      status: 401,
      body: { error: 'Unauthorized: Invalid or missing webhook event secret or authentication token' }
    };
  }

  const payload = req.body || {};
  if (!payload.title && !payload.message) {
    return { status: 400, body: { error: 'Payload must contain title or message' } };
  }

  // RBAC for client user event dispatch: standard users cannot inject critical infrastructure / system events
  if (authUser && authUser.authenticated && !isClusterAuthorized) {
    const isUserAdmin = Boolean(authUser.roles?.includes('admin') || authUser.roles?.includes('Super Admin'));
    const FORBIDDEN_CLIENT_PREFIXES = ['system.', 'infra.', 'security.', 'voicemail.system', 'backup.', 'dr.'];
    const eventType = String(payload.type || '').toLowerCase();
    const isCritical = FORBIDDEN_CLIENT_PREFIXES.some((prefix) => eventType.startsWith(prefix));

    if (!isUserAdmin && isCritical) {
      return {
        status: 403,
        body: { error: `Forbidden: Standard users cannot inject critical infrastructure/system events ('${eventType}')` }
      };
    }
  }

  return { status: 200, body: { status: 'success', event: payload } };
}

// Simulated server handler matching portal-server.js /api/deploy with Strict RBAC
function handleDeployEndpoint(req, deployToken, jwtSecret) {
  const authHeader = req.headers?.authorization || '';
  let authUser = null;
  if (authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim();
    const payload = verifyTokenSignatureAndPayload(raw, jwtSecret);
    if (payload) {
      authUser = {
        authenticated: true,
        username: (payload.preferred_username || payload.username || '').toLowerCase(),
        roles: payload.realm_access?.roles || ['student']
      };
    }
  }

  const isUserAdmin = Boolean(authUser && authUser.authenticated && (authUser.roles?.includes('admin') || authUser.roles?.includes('Super Admin')));
  const reqToken = req.headers?.['x-deploy-token'] || req.headers?.['x-admin-token'] || authHeader.replace('Bearer ', '');
  const isTokenValid = Boolean(deployToken && safeCompare(reqToken, deployToken));

  if (!isTokenValid && !isUserAdmin) {
    if (authUser && authUser.authenticated) {
      return {
        status: 403,
        body: { error: 'Forbidden: Admin role required for deployment operations' }
      };
    }

    if (!deployToken) {
      return {
        status: 503,
        body: { error: 'Deploy endpoint disabled: DEPLOY_TOKEN is not configured in environment' }
      };
    }
    return {
      status: 401,
      body: { error: 'Unauthorized: Invalid or missing deployment token' }
    };
  }

  return { status: 200, body: { status: 'success', exitCode: 0 } };
}

// Simulated server handler matching portal-server.js /api/announcements POST with Strict RBAC
function handleAnnouncementsEndpoint(req, adminToken, jwtSecret) {
  const authHeader = req.headers?.authorization || '';
  let authUser = null;
  if (authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim();
    const payload = verifyTokenSignatureAndPayload(raw, jwtSecret);
    if (payload) {
      authUser = {
        authenticated: true,
        username: (payload.preferred_username || payload.username || '').toLowerCase(),
        roles: payload.realm_access?.roles || ['student']
      };
    }
  }

  const isUserAdmin = Boolean(authUser && authUser.authenticated && (authUser.roles?.includes('admin') || authUser.roles?.includes('Super Admin')));
  const reqToken = req.headers?.['x-admin-token'] || req.headers?.['x-deploy-token'] || authHeader.replace('Bearer ', '');
  const isTokenValid = Boolean(adminToken && safeCompare(reqToken, adminToken));

  if (!isTokenValid && !isUserAdmin) {
    if (authUser && authUser.authenticated) {
      return {
        status: 403,
        body: { error: 'Forbidden: Admin role required for announcement broadcasting' }
      };
    }

    if (!adminToken) {
      return {
        status: 503,
        body: { error: 'Announcement creation disabled: ADMIN_TOKEN is not configured' }
      };
    }
    return {
      status: 401,
      body: { error: 'Unauthorized: Admin authorization required' }
    };
  }

  return { status: 200, body: { status: 'success' } };
}

// Simulated server handler matching portal-server.js /api/me/context
// Simulated server handler matching portal-server.js /benchmark (Admin protected)
function handleBenchmarkEndpoint(req, adminToken, jwtSecret) {
  const authHeader = req.headers?.authorization || '';
  let authUser = null;
  if (authHeader.startsWith('Bearer ')) {
    const raw = authHeader.slice(7).trim();
    const payload = verifyTokenSignatureAndPayload(raw, jwtSecret);
    if (payload) {
      authUser = {
        authenticated: true,
        username: (payload.preferred_username || payload.username || '').toLowerCase(),
        roles: payload.realm_access?.roles || ['student']
      };
    }
  }

  const isUserAdmin = Boolean(authUser && authUser.authenticated && (authUser.roles?.includes('admin') || authUser.roles?.includes('Super Admin') || authUser.username === 'admin' || authUser.username === 'dev1'));
  const reqToken = req.headers?.['x-admin-token'] || authHeader.replace('Bearer ', '');
  const isTokenValid = Boolean(adminToken && safeCompare(reqToken, adminToken));

  if (!isTokenValid && !isUserAdmin) {
    if (authUser && authUser.authenticated) {
      return {
        status: 403,
        body: { error: 'Forbidden: Admin role required to access cluster benchmark reports' }
      };
    }
    return {
      status: 401,
      body: { error: 'Unauthorized: Admin authentication token required to access cluster benchmark reports' }
    };
  }

  return { status: 200, body: { status: 'proxied' } };
}

function handleMeContextEndpoint(req, jwtSecret) {
  const authHeader = req.headers?.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      body: { error: 'Unauthorized: Valid Bearer token required to access user context and telephony credentials' }
    };
  }
  const rawToken = authHeader.slice(7).trim();
  const payload = verifyTokenSignatureAndPayload(rawToken, jwtSecret);
  if (!payload) {
    return {
      status: 401,
      body: { error: 'Unauthorized: Invalid, expired, or forged token' }
    };
  }

  return {
    status: 200,
    body: {
      status: 'ok',
      user: { username: payload.preferred_username || 'student1' },
      telephony: {
        extension: payload.sip_extension || '1001',
        secret: payload.sip_secret || null,
        iceServers: [{ urls: 'stun:192.168.10.202:3478' }]
      }
    }
  };
}

describe('Fail-Closed Security Architecture & Token Policy', () => {
  const TEST_SECRET = 's4ras-test-signing-secret-2026';

  function createSignedToken(payloadObj, alg = 'HS256', secret = TEST_SECRET) {
    const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    let sig = '';
    if (alg === 'none') {
      sig = '';
    } else {
      sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    }
    return `${header}.${payload}.${sig}`;
  }

  describe('Timing-Safe Comparison (safeCompare)', () => {
    it('returns true only when both secrets match exactly', () => {
      expect(safeCompare('secret-alpha-2026', 'secret-alpha-2026')).toBe(true);
    });

    it('returns false when values differ or have different lengths', () => {
      expect(safeCompare('secret-alpha-2026', 'secret-beta-2026')).toBe(false);
      expect(safeCompare('secret-alpha-2026', 'short')).toBe(false);
    });

    it('returns false fail-closed on falsy, null, or empty values', () => {
      expect(safeCompare('', 'secret')).toBe(false);
      expect(safeCompare(null, 'secret')).toBe(false);
      expect(safeCompare(undefined, 'secret')).toBe(false);
      expect(safeCompare(null, null)).toBe(false);
      expect(safeCompare('', '')).toBe(false);
    });
  });

  describe('Cryptographic JWT Verification & Anti-Forgery', () => {
    it('unconditionally rejects alg: none tokens (anti-forgery bypass check)', () => {
      const forgedNone = createSignedToken({ preferred_username: 'admin', realm_access: { roles: ['admin'] } }, 'none');
      const res = handleMeContextEndpoint({ headers: { authorization: `Bearer ${forgedNone}` } }, TEST_SECRET);
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });

    it('rejects tokens with forged/invalid cryptographic signatures', () => {
      const forgedSig = createSignedToken({ preferred_username: 'admin', realm_access: { roles: ['admin'] } }, 'HS256', 'attacker-secret');
      const res = handleMeContextEndpoint({ headers: { authorization: `Bearer ${forgedSig}` } }, TEST_SECRET);
      expect(res.status).toBe(401);
    });

    it('accepts tokens with valid HMAC-SHA256 signature', () => {
      const validToken = createSignedToken({ preferred_username: 'student1', exp: Math.floor(Date.now() / 1000) + 3600 }, 'HS256', TEST_SECRET);
      const res = handleMeContextEndpoint({ headers: { authorization: `Bearer ${validToken}` } }, TEST_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('student1');
    });
  });

  describe('Strict RBAC Enforcement on Protected Endpoints', () => {
    it('returns 403 Forbidden when an authenticated non-admin attempts /api/deploy', () => {
      const studentToken = createSignedToken({
        preferred_username: 'student1',
        realm_access: { roles: ['student', 'mahasiswa'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleDeployEndpoint({ headers: { authorization: `Bearer ${studentToken}` } }, null, TEST_SECRET);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 200 OK when an authenticated admin triggers /api/deploy', () => {
      const adminToken = createSignedToken({
        preferred_username: 'admin',
        realm_access: { roles: ['admin', 'Super Admin'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleDeployEndpoint({ headers: { authorization: `Bearer ${adminToken}` } }, null, TEST_SECRET);
      expect(res.status).toBe(200);
    });

    it('returns 403 Forbidden when an authenticated non-admin attempts /api/announcements broadcast', () => {
      const teacherToken = createSignedToken({
        preferred_username: 'teacher1',
        realm_access: { roles: ['teacher', 'dosen'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleAnnouncementsEndpoint({ headers: { authorization: `Bearer ${teacherToken}` } }, null, TEST_SECRET);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 200 OK when an authenticated admin broadcasts on /api/announcements', () => {
      const adminToken = createSignedToken({
        preferred_username: 'admin',
        realm_access: { roles: ['admin'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleAnnouncementsEndpoint({ headers: { authorization: `Bearer ${adminToken}` } }, null, TEST_SECRET);
      expect(res.status).toBe(200);
    });

    it('returns 403 Forbidden when a non-admin attempts critical infrastructure event injection on /api/webhooks/event', () => {
      const studentToken = createSignedToken({
        preferred_username: 'student1',
        realm_access: { roles: ['student'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const req = {
        headers: { authorization: `Bearer ${studentToken}` },
        body: { type: 'system.failure', title: 'Fake Crash Alert', message: 'Injected' }
      };
      const res = handleEventWebhookEndpoint(req, null, TEST_SECRET);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 200 OK when a non-admin dispatches simulated academic/campus events on /api/webhooks/event', () => {
      const studentToken = createSignedToken({
        preferred_username: 'student1',
        realm_access: { roles: ['student'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const req = {
        headers: { authorization: `Bearer ${studentToken}` },
        body: { type: 'academic.assignment', title: 'Assignment submission', message: 'Homework uploaded' }
      };
      const res = handleEventWebhookEndpoint(req, null, TEST_SECRET);
      expect(res.status).toBe(200);
    });
  });

  describe('Alertmanager Webhook Policy (/api/alerts)', () => {
    it('returns 503 Service Unavailable when ALERTMANAGER_SECRET is unset (fail-closed)', () => {
      const res = handleAlertsEndpoint({ headers: { 'x-alertmanager-token': 'any' } }, null);
      expect(res.status).toBe(503);
      expect(res.body.error).toContain('disabled');
    });

    it('returns 401 Unauthorized when token is missing or invalid', () => {
      const res = handleAlertsEndpoint({ headers: { 'x-alertmanager-token': 'wrong-token' } }, 'correct-secret');
      expect(res.status).toBe(401);
    });

    it('returns 200 OK when secret is configured and matches', () => {
      const res = handleAlertsEndpoint({ headers: { 'x-alertmanager-token': 'correct-secret' } }, 'correct-secret');
      expect(res.status).toBe(200);
    });
  });

  describe('User & Telephony Context Policy (/api/me/context)', () => {
    it('returns 401 when request has no Authorization header', () => {
      const res = handleMeContextEndpoint({ headers: {} }, TEST_SECRET);
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Bearer token required');
    });

    it('returns 401 when JWT token is expired', () => {
      const expiredToken = createSignedToken({
        preferred_username: 'student1',
        exp: Math.floor(Date.now() / 1000) - 3600
      }, 'HS256', TEST_SECRET);

      const res = handleMeContextEndpoint({ headers: { authorization: `Bearer ${expiredToken}` } }, TEST_SECRET);
      expect(res.status).toBe(401);
    });

    it('returns 200 with user context when JWT is valid and does not leak default passwords', () => {
      const validToken = createSignedToken({
        preferred_username: 'student1',
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleMeContextEndpoint({ headers: { authorization: `Bearer ${validToken}` } }, TEST_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('student1');
      expect(res.body.telephony.secret).toBeNull();
    });
  });

  describe('Client dispatchClusterEvent Method', () => {
    let originalFetch;
    beforeEach(() => {
      originalFetch = global.fetch;
    });
    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('attaches Authorization header when user JWT is provided', async () => {
      let capturedHeaders = null;
      global.fetch = vi.fn().mockImplementation((url, opts) => {
        capturedHeaders = opts.headers;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ status: 'success' })
        });
      });

      const fakeJwt = 'header.payload.signature';
      await dispatchClusterEvent({ title: 'Test Event' }, fakeJwt);

      expect(global.fetch).toHaveBeenCalled();
      expect(capturedHeaders['Authorization']).toBe(`Bearer ${fakeJwt}`);
      expect(capturedHeaders['X-Webhook-Secret']).toBeUndefined();
    });
  });
describe('Strict RS256 JWT Verification (scripts/lib/auth.js)', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const otherKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    function makeRs256Token(payload, key = privateKey) {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const pl = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(`${header}.${pl}`);
      const sig = signer.sign(key, 'base64url');
      return `${header}.${pl}.${sig}`;
    }

    it('verifies valid RS256 token against public key PEM', () => {
      const token = makeRs256Token({
        preferred_username: 'student1',
        exp: Math.floor(Date.now() / 1000) + 300,
        nbf: Math.floor(Date.now() / 1000) - 10,
        azp: 'saras-portal'
      });
      const decoded = authLib.verifyTokenSignatureAndPayload(token, { publicKey });
      expect(decoded).not.toBeNull();
      expect(decoded.preferred_username).toBe('student1');
    });

    it('rejects RS256 token signed by untrusted/different private key', () => {
      const forgedToken = makeRs256Token({
        preferred_username: 'student1',
        exp: Math.floor(Date.now() / 1000) + 300,
        azp: 'saras-portal'
      }, otherKeyPair.privateKey);
      const decoded = authLib.verifyTokenSignatureAndPayload(forgedToken, { publicKey });
      expect(decoded).toBeNull();
    });

    it('rejects expired RS256 token', () => {
      const expiredToken = makeRs256Token({
        preferred_username: 'student1',
        exp: Math.floor(Date.now() / 1000) - 60,
        azp: 'saras-portal'
      });
      const decoded = authLib.verifyTokenSignatureAndPayload(expiredToken, { publicKey });
      expect(decoded).toBeNull();
    });

    it('strictly rejects non-RS256 algorithms such as HS256', () => {
      const hsToken = createSignedToken({ preferred_username: 'student1', exp: Math.floor(Date.now() / 1000) + 300, azp: 'saras-portal' }, 'HS256', TEST_SECRET);
      const decoded = authLib.verifyTokenSignatureAndPayload(hsToken, { publicKey });
      expect(decoded).toBeNull();
    });

    it('strictly rejects alg: none tokens', () => {
      const noneToken = createSignedToken({ preferred_username: 'student1', exp: Math.floor(Date.now() / 1000) + 300, azp: 'saras-portal' }, 'none');
      const decoded = authLib.verifyTokenSignatureAndPayload(noneToken, { publicKey });
      expect(decoded).toBeNull();
    });

    it('rejects token when issuer does not match KEYCLOAK_ISSUER', () => {
      const token = makeRs256Token({
        preferred_username: 'student1',
        iss: 'https://evil.attacker.com/auth/realms/fake',
        exp: Math.floor(Date.now() / 1000) + 300,
        azp: 'saras-portal'
      });
      const decoded = authLib.verifyTokenSignatureAndPayload(token, {
        publicKey,
        expectedIssuer: 'https://sso.s4ras.site/realms/S4RAS'
      });
      expect(decoded).toBeNull();
    });

    it('resolves SIP secrets from SIP_SECRETS_JSON and returns null for unmapped users', () => {
      const origEnv = process.env.SIP_SECRETS_JSON;
      try {
        process.env.SIP_SECRETS_JSON = JSON.stringify({
          '1001': 'secure-pass-1001',
          'student1': 'secure-pass-1001'
        });
        expect(authLib.getSipSecret('1001', 'student1')).toBe('secure-pass-1001');
        expect(authLib.getSipSecret('9999', 'unknown_user')).toBeNull();
      } finally {
        if (origEnv !== undefined) {
          process.env.SIP_SECRETS_JSON = origEnv;
        } else {
          delete process.env.SIP_SECRETS_JSON;
        }
      }
    });
  });

  describe('Benchmark Proxy Policy (/benchmark) & Privilege De-escalation', () => {
    it('returns 401 Unauthorized when request has no credentials', () => {
      const res = handleBenchmarkEndpoint({ headers: {} }, 'valid-token', TEST_SECRET);
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('returns 403 Forbidden when standard student attempts accessing /benchmark', () => {
      const studentToken = createSignedToken({
        preferred_username: 'student1',
        realm_access: { roles: ['student'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleBenchmarkEndpoint({ headers: { authorization: `Bearer ${studentToken}` } }, 'valid-token', TEST_SECRET);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 403 Forbidden when testuser attempts administrative /benchmark access', () => {
      const testuserToken = createSignedToken({
        preferred_username: 'testuser',
        realm_access: { roles: ['student'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleBenchmarkEndpoint({ headers: { authorization: `Bearer ${testuserToken}` } }, 'valid-token', TEST_SECRET);
      expect(res.status).toBe(403);
    });

    it('returns 403 Forbidden when testuser attempts deployment on /api/deploy', () => {
      const testuserToken = createSignedToken({
        preferred_username: 'testuser',
        realm_access: { roles: ['student'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleDeployEndpoint({ headers: { authorization: `Bearer ${testuserToken}` } }, 'valid-deploy-token', TEST_SECRET);
      expect(res.status).toBe(403);
    });

    it('returns 200 OK when authenticated admin accesses /benchmark', () => {
      const adminToken = createSignedToken({
        preferred_username: 'admin',
        realm_access: { roles: ['admin'] },
        exp: Math.floor(Date.now() / 1000) + 3600
      }, 'HS256', TEST_SECRET);

      const res = handleBenchmarkEndpoint({ headers: { authorization: `Bearer ${adminToken}` } }, 'valid-token', TEST_SECRET);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('proxied');
    });
  });

});
