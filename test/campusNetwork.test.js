import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRCOM_STATUS_URL,
  buildLoginUrl,
  buildSelfServiceUrl,
  fetchDrcomStatus,
  parseDrcomPayload,
} from '../src/services/campusNetwork.js';

test('parseDrcomPayload parses the Dr.COM callback format', () => {
  const input = new TextEncoder().encode('callback({"result":1,"v4ip":"172.16.1.2"})');
  assert.deepEqual(parseDrcomPayload(input), { result: 1, v4ip: '172.16.1.2' });
});

test('parseDrcomPayload rejects malformed responses', () => {
  const input = new TextEncoder().encode('not jsonp');
  assert.throws(() => parseDrcomPayload(input), /无法识别/);
});

test('buildLoginUrl safely embeds IPv4 and IPv6 addresses', () => {
  for (const ip of ['172.16.1.2', '2001:db8::1']) {
    const loginUrl = new URL(buildLoginUrl(ip));
    const serviceUrl = new URL(loginUrl.searchParams.get('service'));
    assert.equal(serviceUrl.searchParams.get('wlan_user_ip'), ip);
    assert.equal(serviceUrl.searchParams.get('authex_enable'), '');
    assert.equal(serviceUrl.searchParams.get('type'), '1');
  }
});

test('buildSelfServiceUrl embeds the self-service endpoint', () => {
  const loginUrl = new URL(buildSelfServiceUrl());
  assert.equal(loginUrl.hostname, 'sso.dlut.edu.cn');
  assert.equal(loginUrl.searchParams.get('service'), 'http://172.20.30.2:8080/Self/sso_login');
});

test('fetchDrcomStatus uses the local endpoint and parses its response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, DRCOM_STATUS_URL);
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response('callback({"result":1})');
  };

  try {
    assert.deepEqual(await fetchDrcomStatus(), { result: 1 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchDrcomStatus aborts a stalled request after its timeout', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once: true });
  });

  try {
    await assert.rejects(fetchDrcomStatus({ timeoutMs: 5 }), { name: 'AbortError' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
