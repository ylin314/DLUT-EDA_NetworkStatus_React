export function formatBytes(bytes) {
  const kib = 1024;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let i = 0;
  while (bytes > kib) {
    bytes /= kib;
    i++;
  }
  return bytes.toFixed(2) + ' ' + units[i];
}

export function formatMacAddress(mac) {
  return mac.toUpperCase().match(/.{1,2}/g).join('-');
}

export function formatFee(fee) {
  return (fee / 10000).toFixed(2) + ' ' + '元';
}

export function checkUserAgent(UserAgent) {
  const DEVICE_TYPES = {
    'Windows NT': 'Windows',
    'Android': 'Android',
    'iPhone': 'iOS',
    'iPod': 'iOS',
    'iPad': 'iPadOS',
    'Macintosh': 'macOS',
    'Linux': 'Linux'
  };
  const mobileKeywords = ['Windows Phone', 'MQQBrowser'];

  if (UserAgent.includes('OpenHarmony') || UserAgent.includes('HarmonyOS')) {
    if (UserAgent.includes('Phone')) return '华为手机';
    if (UserAgent.includes('Tablet')) return '华为平板';
    if (UserAgent.includes('PC')) return '华为 2in1';
    return '遥遥领先';
  }

  for (const [keyword, type] of Object.entries(DEVICE_TYPES)) {
    if (UserAgent.includes(keyword)) return type;
  }

  if (mobileKeywords.some(keyword => UserAgent.includes(keyword))) {
    return '移动终端';
  }

  return '未知设备';
}
