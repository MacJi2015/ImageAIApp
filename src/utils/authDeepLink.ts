/** OAuth 回调：imageai://auth/instagram?token=xxx / imageai://auth/x?token=xxx 或 ?code=xxx&state=xxx（PKCE）/ imageai://auth/tiktok?token=xxx */
export const AUTH_DEEP_LINK_PREFIX = 'imageai://auth/';

export type AuthCallbackParsed =
  | { type: 'token'; loginFrom: 7 | 8 | 9; idToken: string }
  | { type: 'x_code'; code: string; state: string };

export function parseAuthCallbackUrl(url: string): AuthCallbackParsed | null {
  if (!url.startsWith(AUTH_DEEP_LINK_PREFIX)) return null;
  let path = url.slice(AUTH_DEEP_LINK_PREFIX.length);
  const hashIdx = path.indexOf('#');
  if (hashIdx !== -1) path = path.slice(0, hashIdx);
  const qIdx = path.indexOf('?');
  if (qIdx === -1) return null;
  const provider = path.slice(0, qIdx).replace(/\/+$/, '');
  const query = path.slice(qIdx + 1);
  if (!query) return null;
  const params = new URLSearchParams(query);
  const code = params.get('code');
  const state = params.get('state');
  if (provider === 'x' && code && state) {
    return { type: 'x_code', code, state };
  }
  const token = params.get('token');
  if (!token) return null;
  if (provider === 'instagram') return { type: 'token', loginFrom: 7, idToken: token };
  if (provider === 'x') return { type: 'token', loginFrom: 8, idToken: token };
  if (provider === 'tiktok') return { type: 'token', loginFrom: 9, idToken: token };
  return null;
}
