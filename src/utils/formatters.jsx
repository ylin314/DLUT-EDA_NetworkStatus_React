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
  var mobileKeywords = ["Windows Phone", "MQQBrowser"];

  if (UserAgent.includes("Windows NT")) {
    return "Windows";
  }
  if (UserAgent.includes("OpenHarmony") || UserAgent.includes("HarmonyOS")) {
    if (UserAgent.includes("Phone")) {
      return "华为手机";
    }
    if (UserAgent.includes("Tablet")) {
      return "华为平板";
    }
    if (UserAgent.includes("PC")) {
      return "华为 2in1";
    }
    else {
      return "遥遥领先";
    }
  }
  if (UserAgent.includes("Android")) {
    return "Android";
  }
  if (UserAgent.includes("iPhone") || UserAgent.includes("iPod")) {
    return "iOS";
  }
  if (UserAgent.includes("iPad")) {
    return "iPadOS";
  }
  if (UserAgent.includes("Macintosh")) {
    return "macOS";
  }
  if (UserAgent.includes("Linux")) {
    return "Linux";
  }
  for (var i = 0; i < mobileKeywords.length; i++) {
    if (UserAgent.includes(mobileKeywords[i])) {
      return "移动终端";
    }
  }
  return "未知设备";
}
