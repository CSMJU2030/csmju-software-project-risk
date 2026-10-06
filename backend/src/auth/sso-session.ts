export const SSO_COOKIE_NAME = 'csmju_software_project_risk_access_token';
export const SSO_STATE_COOKIE_NAME = 'csmju_software_project_risk_sso_state';
export const SSO_STATE_MAX_AGE_SEC = 600;

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }
  return null;
}

function attributes(secure: boolean, path = '/'): string[] {
  const values = [`Path=${path}`, 'HttpOnly', 'SameSite=Lax'];
  if (secure) values.push('Secure');
  return values;
}

export function buildStateCookie(state: string, next: string, secure: boolean): string {
  const encodedNext = Buffer.from(next, 'utf8').toString('base64url');
  return [
    `${SSO_STATE_COOKIE_NAME}=${encodeURIComponent(`${state}.${encodedNext}`)}`,
    ...attributes(secure, '/auth/callback'),
    `Max-Age=${SSO_STATE_MAX_AGE_SEC}`,
  ].join('; ');
}

export function parseStateCookie(value: string | null): { state: string; next: string } | null {
  if (!value) return null;
  const separator = value.indexOf('.');
  if (separator <= 0) return null;
  const state = value.slice(0, separator);
  const encodedNext = value.slice(separator + 1);
  if (!state || !encodedNext) return null;
  try {
    const next = Buffer.from(encodedNext, 'base64url').toString('utf8');
    if (!next) return null;
    return { state, next };
  } catch {
    return null;
  }
}

export function clearCookie(name: string, secure: boolean): string {
  const path = name === SSO_STATE_COOKIE_NAME ? '/auth/callback' : '/';
  return [`${name}=`, ...attributes(secure, path), 'Max-Age=0'].join('; ');
}

export function buildSsoCookie(token: string, maxAgeSec: number, secure: boolean): string {
  return [
    `${SSO_COOKIE_NAME}=${encodeURIComponent(token)}`,
    ...attributes(secure, '/'),
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`,
  ].join('; ');
}