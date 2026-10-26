/**
 * S4RAS Authentication & Cryptographic Verification Library (Phase 1 Hardening)
 * Handles timing-safe comparisons, strict RS256 JWT validation via crypto,
 * and secure credential resolution from environment variables (SIP_SECRETS_JSON).
 */

const crypto = require('crypto');

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function formatPublicKey(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN PUBLIC KEY') || trimmed.includes('BEGIN RSA PUBLIC KEY')) {
    return trimmed;
  }
  const cleanKey = trimmed.replace(/\r?\n|\r/g, '');
  const wrapped = cleanKey.match(/.{1,64}/g)?.join('\n') || cleanKey;
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

let KEYCLOAK_PUBLIC_KEY = formatPublicKey(process.env.KEYCLOAK_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY);

function setKeycloakPublicKey(raw) {
  KEYCLOAK_PUBLIC_KEY = formatPublicKey(raw);
}

function getKeycloakPublicKey() {
  if (!KEYCLOAK_PUBLIC_KEY && (process.env.KEYCLOAK_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY)) {
    KEYCLOAK_PUBLIC_KEY = formatPublicKey(process.env.KEYCLOAK_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY);
  }
  return KEYCLOAK_PUBLIC_KEY;
}

// In-memory JWKS cache (TTL: 10 minutes)
let jwksCache = {
  keys: [],
  expiresAt: 0
};

function setJwksKeys(keys, ttlMs = 10 * 60 * 1000) {
  if (Array.isArray(keys)) {
    jwksCache = {
      keys,
      expiresAt: Date.now() + ttlMs
    };
  }
}

async function getJwksKeys(jwksUrl = process.env.KEYCLOAK_JWKS_URL) {
  const now = Date.now();
  if (jwksCache.keys.length > 0 && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }
  if (!jwksUrl) return jwksCache.keys;
  try {
    const res = await fetch(jwksUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.keys)) {
        jwksCache = {
          keys: data.keys,
          expiresAt: now + 10 * 60 * 1000
        };
        return jwksCache.keys;
      }
    }
  } catch (err) {
    console.warn(`[JWKS Fetch Warning] ${err.message}`);
  }
  return jwksCache.keys;
}

function getSipSecret(extension, username) {
  let secretsMap = {};
  if (process.env.SIP_SECRETS_JSON) {
    try {
      secretsMap = JSON.parse(process.env.SIP_SECRETS_JSON);
    } catch {
      console.warn('[SIP Secrets] Failed to parse SIP_SECRETS_JSON');
    }
  }
  const secret = secretsMap[extension] || (username && secretsMap[username.toLowerCase()]) || process.env[`SIP_SECRET_${extension}`] || null;
  return secret || null;
}

function verifyTokenSignatureAndPayload(rawToken, options = {}) {
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

  // Strict Alg enforcement: RS256 ONLY. Reject none, HS256, ES256, etc.
  if (!header || !header.alg || header.alg.toUpperCase() !== 'RS256') {
    return null;
  }

  // Strict Expiration & NBF Claims Validation
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    return null;
  }
  if (payload.nbf && payload.nbf > nowSec) {
    return null;
  }

  // Issuer Validation (default: https://sso.s4ras.site/realms/S4RAS)
  const expectedIssuer = options.expectedIssuer || process.env.KEYCLOAK_ISSUER || 'https://sso.s4ras.site/realms/S4RAS';
  if (payload.iss && payload.iss !== expectedIssuer) {
    return null;
  }

  // Authorized Party (azp) Client Allowlist
  const defaultAllowedAzp = ['front-end', 'saras-portal', 'account', 'broker', 'admin-cli', 'moodle', 'nextcloud', 'jellyfin'];
  const allowedAzp = options.allowedAzp || (process.env.KEYCLOAK_ALLOWED_CLIENTS
    ? process.env.KEYCLOAK_ALLOWED_CLIENTS.split(',').map(s => s.trim().toLowerCase())
    : defaultAllowedAzp);

  if (payload.azp && !allowedAzp.includes(String(payload.azp).toLowerCase())) {
    return null;
  }

  // Cryptographic Signature Verification
  const signedData = Buffer.from(`${headerB64}.${payloadB64}`);
  const sigBuffer = Buffer.from(signatureB64, 'base64url');

  let keyObject = null;

  // 1. Check explicit key passed in options
  if (options.publicKey) {
    try {
      keyObject = typeof options.publicKey === 'string'
        ? crypto.createPublicKey(options.publicKey)
        : options.publicKey;
    } catch {
      return null;
    }
  }

  // 2. Check JWKS cache matching header.kid
  if (!keyObject && header.kid && jwksCache.keys.length > 0) {
    const matchingJwk = jwksCache.keys.find(k => k.kid === header.kid);
    if (matchingJwk) {
      try {
        keyObject = crypto.createPublicKey({ key: matchingJwk, format: 'jwk' });
      } catch {
        keyObject = null;
      }
    }
  }

  // 3. Check statically configured KEYCLOAK_PUBLIC_KEY
  if (!keyObject) {
    const rsaPem = getKeycloakPublicKey();
    if (rsaPem) {
      try {
        keyObject = crypto.createPublicKey(rsaPem);
      } catch {
        keyObject = null;
      }
    }
  }

  if (keyObject) {
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(signedData);
      const isVerified = verifier.verify(keyObject, sigBuffer);
      if (!isVerified) return null;
    } catch {
      return null;
    }
  } else {
    // Fail-closed: in production or without test bypass, signature cannot be validated
    if (process.env.NODE_ENV === 'production' || !options.allowDevMock) {
      return null;
    }
    // Strict dev/test harness mode: only if explicitly allowed and non-empty sig
    if (!signatureB64 || signatureB64.length < 8) {
      return null;
    }
  }

  return payload;
}

function parseTokenContext(req, options = {}) {
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim();
    const payload = verifyTokenSignatureAndPayload(rawToken, options);
    if (payload) {
      const username = (payload.preferred_username || payload.username || '').toLowerCase();
      if (!username) return null;

      const dynExt = payload.sip_extension || (username === 'testuser' ? '1079348' : (username === 'admin' || username === 'dev1') ? '1003' : username === 'teacher1' ? '1002' : '1001');
      const sipSecret = getSipSecret(dynExt, username);

      return {
        authenticated: true,
        username,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || username,
        email: payload.email || `${username}@s4ras.site`,
        department: payload.department || (username === 'testuser' ? 'Research Fellowship / S4RAS' : username === 'admin' ? 'Rektorat & Administrasi Sistem' : username === 'teacher1' ? 'Teknik Elektro & Telematika' : 'Teknik Informatika'),
        storage_quota: payload.storage_quota || (username === 'testuser' ? '200GB' : username === 'admin' ? '500GB' : username === 'teacher1' ? '50GB' : '15GB'),
        moodle_cohort: payload.moodle_cohort || (username === 'testuser' ? 'RESEARCH-FELLOW-2026' : username === 'admin' ? 'ADMIN-CLUSTER' : 'KOM-401-2026'),
        sip_extension: dynExt,
        sip_secret: sipSecret, // Only returned if token verified and configured in SIP_SECRETS_JSON
        roles: payload.realm_access?.roles || ['student']
      };
    }
  }

  // If no valid token, return unauthenticated public context (SIP secret is NEVER returned)
  return null;
}

module.exports = {
  safeCompare,
  formatPublicKey,
  setKeycloakPublicKey,
  getKeycloakPublicKey,
  setJwksKeys,
  getJwksKeys,
  getSipSecret,
  verifyTokenSignatureAndPayload,
  parseTokenContext,
  KEYCLOAK_PUBLIC_KEY
};
