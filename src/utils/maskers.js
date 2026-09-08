export function maskAccount(value) {
  if (!value) return '-';
  const text = String(value);
  if (text.length <= 6) return '*****';

  const tailCount = Math.min(text.length - 6, 2);
  const headCount = Math.min(text.length - 7, 4);
  return `${text.slice(0, headCount)}*****${text.slice(-tailCount)}`;
}

export function maskIp(value) {
  if (!value) return '-';
  const text = String(value);
  const ipv4Parts = text.split('.');

  if (ipv4Parts.length === 4) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.***.***`;
  }

  if (text.includes(':')) {
    const visiblePrefix = text.split(':').slice(0, 2).join(':');
    return `${visiblePrefix}:****:****`;
  }

  return '***';
}

export function maskMac(value) {
  if (!value) return '-';
  const parts = String(value).split('-');
  if (parts.length < 5) return '**-**-**-**-**-**';
  return [parts[0], parts[1], '**', '**', '**', parts[parts.length - 1]].join('-');
}
