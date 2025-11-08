import { useState, useEffect, useCallback } from 'react';
import { formatBytes, formatMacAddress, formatFee, checkUserAgent } from '../utils/formatters';

export function useNetworkStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(() => {
    if (isLoading) return;

    setIsLoading(true);

    if (!navigator.onLine) {
      setData({
        result: 0,
        onlineStatus: '未连接到校园网'
      });
      setError('');
      setIsLoading(false);
      return;
    }

    fetch('http://172.20.30.1/drcom/chkstatus?callback=')
      .then(response => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        let decoder = new TextDecoder('gbk');
        let text = decoder.decode(arrayBuffer);
        let jsonText = "{" + text.split("({")[1].split("})")[0] + "}";
        let parsedData = JSON.parse(jsonText);

        parsedData.terminalType = checkUserAgent(navigator.userAgent);

        // 格式化数据
        const formattedData = {
          result: parsedData.result,
          onlineStatus: parsedData.result === 1 ? '在线' : '离线',
          account: parsedData.uid || '-',
          name: parsedData.NID || '-',
          ipAddress: parsedData.v4ip || parsedData.v46ip || '-',
          macAddress: parsedData.olmac ? formatMacAddress(parsedData.olmac) : '-',
          remainingFlow: parsedData.olflow ? formatBytes(parsedData.olflow) : '-',
          remainingFee: parsedData.fee ? formatFee(parsedData.fee) : '-',
          terminalType: parsedData.terminalType || '-',
          v4ip: parsedData.v4ip,
          v46ip: parsedData.v46ip
        };

        // console.log(formattedData)

        setData(formattedData);
        setError('');
      })
      .catch(err => {
        setError(`加载失败, 请检查是否处于校园网环境:${err.message || err}`);
        setData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return { data, error, loadData };
}
