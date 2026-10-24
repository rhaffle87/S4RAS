/**
 * S4RAS Authentication & Cryptographic Verification Library
 * Handles timing-safe comparisons, JWT signature validation (RSA & HMAC), and user context extraction.
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

const KEYCLOAK_PUBLIC_KEY = formatPublicKey(process.env.KEYCLOAK_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

function verifyTokenSignatureAndPayload(rawToken) {
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

  // Anti-forgery check: unconditional rejection of 'none' algorithm
  if (!header || !header.alg || header.alg.toLowerCase() === 'none') {
    console.warn('[JWT Security] Rejected token with insecure alg: none');
    return null;
  }

  // Strict Expiration & NBF Claims Validation
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    console.warn('[JWT Security] Rejected expired token');
    return null;
  }
  if (payload.nbf && payload.nbf > nowSec) {
    console.warn('[JWT Security] Rejected not-yet-valid token (nbf)');
    return null;
  }

  // Cryptographic Signature Verification
  const signedData = `${headerB64}.${payloadB64}`;
  const sigBuffer = Buffer.from(signatureB64, 'base64url');

  if (header.alg.startsWith('RS') && KEYCLOAK_PUBLIC_KEY) {
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(signedData);
      const isVerified = verifier.verify(KEYCLOAK_PUBLIC_KEY, sigBuffer);
      if (!isVerified) {
        console.warn('[JWT Security] RSA Signature verification failed');
        return null;
      }
    } catch (err) {
      console.warn(`[JWT Security] RSA verification error: ${err.message}`);
      return null;
    }
  } else if (header.alg.startsWith('HS') && JWT_SECRET) {
    try {
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(signedData).digest('base64url');
      if (!safeCompare(signatureB64, expectedSig)) {
        console.warn('[JWT Security] HMAC Signature verification failed');
        return null;
      }
    } catch (err) {
      console.warn(`[JWT Security] HMAC verification error: ${err.message}`);
      return null;
    }
  } else {
    // Fail-closed in production if no cryptographic key is configured
    if (process.env.NODE_ENV === 'production') {
      console.warn('[JWT Security] Fail-closed: KEYCLOAK_PUBLIC_KEY or JWT_SECRET must be configured in production');
      return null;
    }
    // In dev / test: require at least a non-empty signature component (reject unsigned/empty sig)
    if (!signatureB64 || signatureB64.length < 8) {
      console.warn('[JWT Security] Rejected unsigned/forged token without signature in dev mode');
      return null;
    }
  }

  return payload;
}

function parseTokenContext(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim();
    const payload = verifyTokenSignatureAndPayload(rawToken);
    if (payload) {
      const username = (payload.preferred_username || payload.username || '').toLowerCase();
      if (!username) return null;

      const dynExt = payload.sip_extension || (username === 'testuser' ? '1079348' : username === 'admin' ? '1074700' : username === 'dev1' ? '1003' : username === 'teacher1' ? '1002' : '1001');
      const envSipSecret = process.env[`SIP_SECRET_${username.toUpperCase()}`] || process.env[`SIP_SECRET_${dynExt}`] || (process.env.NODE_ENV !== 'production' ? 'dev-mock-sip-secret' : null);
      return {
        authenticated: true,
        username,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || username,
        email: payload.email || `${username}@s4ras.site`,
        department: payload.department || (username === 'testuser' ? 'Research Fellowship / S4RAS' : username === 'admin' ? 'Rektorat & Administrasi Sistem' : username === 'teacher1' ? 'Teknik Elektro & Telematika' : 'Teknik Informatika'),
        storage_quota: payload.storage_quota || (username === 'testuser' ? '200GB' : username === 'admin' ? '500GB' : username === 'teacher1' ? '50GB' : '15GB'),
        moodle_cohort: payload.moodle_cohort || (username === 'testuser' ? 'RESEARCH-FELLOW-2026' : username === 'admin' ? 'ADMIN-CLUSTER' : 'KOM-401-2026'),
        sip_extension: dynExt,
        sip_secret: payload.sip_secret || envSipSecret || null,
        roles: payload.realm_access?.roles || ['student']
      };
    }
  }

  return null;
}

module.exports = {
  safeCompare,
  formatPublicKey,
  verifyTokenSignatureAndPayload,
  parseTokenContext,
  KEYCLOAK_PUBLIC_KEY,
  JWT_SECRET
};
