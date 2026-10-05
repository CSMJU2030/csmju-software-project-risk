import { exportJWK, generateKeyPair, SignJWT } from 'jose';

export const CORE_HUB_ISSUER = 'core-hub';
export const CORE_HUB_AUDIENCE = 'csmju2030';

export interface TestSigningKey {
  kid: string;
  privateKey: any;
  publicKey: any;
  publicJwk: any;
}

export async function createSigningKey(kid: string): Promise<TestSigningKey> {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  return { kid, privateKey, publicKey, publicJwk };
}

export function jwksDocument(keys: TestSigningKey[]) {
  return { keys: keys.map((key) => key.publicJwk) };
}

export function rawJwks(keys: Array<Record<string, unknown>>) {
  return { keys };
}

export async function signCoreHubToken(
  key: TestSigningKey,
  claims: Record<string, unknown> = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSec = typeof claims.expiresInSec === 'number' ? claims.expiresInSec : 900;
  const issuedAtOffsetSec = typeof claims.issuedAtOffsetSec === 'number' ? claims.issuedAtOffsetSec : 0;
  const payload = { ...claims } as Record<string, unknown>;
  const issuer = typeof payload.issuer === 'string' ? payload.issuer : CORE_HUB_ISSUER;
  const audience = typeof payload.audience === 'string' ? payload.audience : CORE_HUB_AUDIENCE;
  const omitSub = payload.omitSub === true;
  delete payload.expiresInSec;
  delete payload.issuedAtOffsetSec;
  delete payload.issuer;
  delete payload.audience;
  delete payload.omitSub;
  const baseClaims: Record<string, unknown> = {
    email: 'staff@core.local',
    role: 'staff',
    sid: 'session-id',
    ...payload,
  };
  if (!omitSub) baseClaims.sub = 'user-003';
  return new SignJWT(baseClaims)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: key.kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt(now + issuedAtOffsetSec)
    .setExpirationTime(now + issuedAtOffsetSec + expiresInSec)
    .sign(key.privateKey);
}

export function createAlgNoneToken(payload: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ sub: 'user-003', ...payload })).toString('base64url');
  return `${header}.${body}.`;
}

export function signHs256Token(payload: Record<string, unknown> = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'core-hub-2026' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ sub: 'user-003', ...payload })).toString('base64url');
  return `${header}.${body}.invalid-signature`;
}

export function tamperPayload(token: string, changes: Record<string, unknown>) {
  const [header, payload, signature] = token.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  return `${header}.${Buffer.from(JSON.stringify({ ...decoded, ...changes })).toString('base64url')}.${signature}`;
}
