export const SSO_COOKIE_NAME = 'software_project_risk_access_token';
export const SSO_STATE_COOKIE_NAME = 'software_project_risk_sso_state';
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

function attributes(secure: boolean): string[] {
  const values = ['Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) values.push('Secure');
  return values;
}

export function buildStateCookie(state: string, next: string, secure: boolean): string {
  const payload = Buffer.from(JSON.stringify({ state, next }), 'utf8').toString('base64url');
  return [`${SSO_STATE_COOKIE_NAME}=${encodeURIComponent(payload)}`, ...attributes(secure), `Max-Age=${SSO_STATE_MAX_AGE_SEC}`].join('; ');
}

export function parseStateCookie(value: string | null): { state: string; next: string } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { state?: string; next?: string };
    if (!parsed.state || !parsed.next) return null;
    return { state: parsed.state, next: parsed.next };
  } catch {
    return null;
  }
}

export function clearCookie(name: string, secure: boolean): string {
  return [`${name}=`, ...attributes(secure), 'Max-Age=0'].join('; ');
}

export function buildSsoCookie(token: string, maxAgeSec: number, secure: boolean): string {
  return [
    `${SSO_COOKIE_NAME}=${encodeURIComponent(token)}`,
    ...attributes(secure),
    `Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`,
  ].join('; ');
}
