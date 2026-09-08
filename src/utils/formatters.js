export function formatBytes(bytes) {
  let value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '-';

  const kib = 1024;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let unitIndex = 0;

  while (value >= kib && unitIndex < units.length - 1) {
    value /= kib;
    unitIndex += 1;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export function formatMacAddress(mac) {
  const original = String(mac ?? '').trim().toUpperCase();
  const normalized = original.replace(/[:-]/g, '');

  if (!/^[0-9A-F]{12}$/.test(normalized)) {
    return original || '-';
  }

  return normalized.match(/.{2}/g).join('-');
}

export function formatFee(fee) {
  const value = Number(fee);
  if (!Number.isFinite(value)) return '-';
  return `${(value / 10000).toFixed(2)} 元`;
}

export function checkUserAgent(userAgent = '') {
  if (userAgent.includes('OpenHarmony') || userAgent.includes('HarmonyOS')) {
    if (userAgent.includes('Phone')) return '华为手机';
    if (userAgent.includes('Tablet')) return '华为平板';
    if (userAgent.includes('PC')) return '华为 2in1';
    return '遥遥领先';
  }

  // iPadOS 的桌面模式可能使用 Macintosh 标识，但仍会保留 Mobile。
  if (userAgent.includes('Macintosh') && userAgent.includes('Mobile')) {
    return 'iPadOS';
  }

  const deviceTypes = {
    'Windows NT': 'Windows',
    Android: 'Android',
    iPhone: 'iOS',
    iPod: 'iOS',
    iPad: 'iPadOS',
    Macintosh: 'macOS',
    Linux: 'Linux',
  };

  for (const [keyword, type] of Object.entries(deviceTypes)) {
    if (userAgent.includes(keyword)) return type;
  }

  if (['Windows Phone', 'MQQBrowser'].some((keyword) => userAgent.includes(keyword))) {
    return '移动终端';
  }

  return '未知设备';
}
