export const DRCOM_STATUS_URL = 'http://172.20.30.1/drcom/chkstatus?callback=';
export const SELF_LOGOUT_URL = 'http://172.20.30.2:8080/Self/login/logout';

const SELF_SSO_LOGIN_URL = 'http://172.20.30.2:8080/Self/sso_login';
const CAS_LOGIN_URL = 'https://sso.dlut.edu.cn/cas/login';
const DEFAULT_REQUEST_TIMEOUT_MS = 2500;

export function buildSelfServiceUrl() {
  const url = new URL(CAS_LOGIN_URL);
  url.searchParams.set('service', SELF_SSO_LOGIN_URL);
  return url.toString();
}

export function buildLoginUrl(ip) {
  const serviceUrl = new URL(SELF_SSO_LOGIN_URL);
  serviceUrl.searchParams.set('wlan_user_ip', String(ip));
  serviceUrl.searchParams.set('authex_enable', '');
  serviceUrl.searchParams.set('type', '1');

  const loginUrl = new URL(CAS_LOGIN_URL);
  loginUrl.searchParams.set('service', serviceUrl.toString());
  return loginUrl.toString();
}

export function parseDrcomPayload(arrayBuffer) {
  const text = new TextDecoder('gbk').decode(arrayBuffer);
  const match = text.match(/\(\s*(\{[\s\S]*\})\s*\)\s*;?\s*$/);

  if (!match) {
    throw new Error('无法识别校园网状态响应');
  }

  return JSON.parse(match[1]);
}

export async function fetchDrcomStatus({
  signal,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
} = {}) {
  const controller = new AbortController();
  const abortRequest = () => controller.abort(signal?.reason);
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  if (signal?.aborted) {
    abortRequest();
  } else {
    signal?.addEventListener('abort', abortRequest, { once: true });
  }

  try {
    const response = await fetch(DRCOM_STATUS_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return parseDrcomPayload(await response.arrayBuffer());
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
}
