import test from 'node:test';
import assert from 'node:assert/strict';
import { maskAccount, maskIp, maskMac } from '../src/utils/maskers.js';

test('maskAccount uses five mask characters', () => {
  assert.equal(maskAccount('2023123455'), '202*****55');
  assert.equal(maskAccount('123456'), '*****');
});

test('maskIp masks IPv4, IPv6 and unknown address formats', () => {
  assert.equal(maskIp('172.16.1.123'), '172.16.***.***');
  assert.equal(maskIp('2001:db8::1'), '2001:db8:****:****');
  assert.equal(maskIp('unknown'), '***');
});

test('maskMac does not expose malformed values', () => {
  assert.equal(maskMac('4C-50-AA-BB-CC-DD'), '4C-50-**-**-**-DD');
  assert.equal(maskMac('unknown'), '**-**-**-**-**-**');
});
