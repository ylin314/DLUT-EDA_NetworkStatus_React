import test from 'node:test';
import assert from 'node:assert/strict';
import { checkUserAgent, formatBytes, formatFee, formatMacAddress } from '../src/utils/formatters.js';

test('formatters preserve valid zero values', () => {
  assert.equal(formatBytes(0), '0.00 KiB');
  assert.equal(formatFee(0), '0.00 元');
});

test('formatMacAddress formats raw values and tolerates malformed input', () => {
  assert.equal(formatMacAddress('4c50aabbccdd'), '4C-50-AA-BB-CC-DD');
  assert.equal(formatMacAddress('unknown'), 'UNKNOWN');
});

test('checkUserAgent recognizes iPad desktop mode', () => {
  assert.equal(checkUserAgent('Mozilla/5.0 (Macintosh) AppleWebKit Mobile/15E148'), 'iPadOS');
});
