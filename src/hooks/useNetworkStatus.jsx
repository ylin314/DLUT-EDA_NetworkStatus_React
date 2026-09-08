import { useState, useEffect, useCallback, useRef } from 'react';
import { formatBytes, formatMacAddress, formatFee, checkUserAgent } from '../utils/formatters';
import { MAINTENANCE_NOTICE } from '../config/notices';
import { fetchDrcomStatus } from '../services/campusNetwork';

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

export function useNetworkStatus() {
  const [data, setData] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);
  const hasCheckedFlow = useRef(false);
  const isLoadingRef = useRef(false);
  const requestControllerRef = useRef(null);

  const dismissBanner = useCallback(() => {
    setBannerMessage(null);
  }, []);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;

    if (!navigator.onLine) {
      setData({
        result: 0,
        onlineStatus: '未连接到校园网'
      });
      return;
    }

    isLoadingRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const parsedData = await fetchDrcomStatus({ signal: controller.signal });
      const terminalType = checkUserAgent(navigator.userAgent);

      // 首次请求时检查 olflow 是否异常（仅在通知开启时检查）
      if (MAINTENANCE_NOTICE.enabled && !hasCheckedFlow.current) {
        const olflow = Number(parsedData.olflow);
        if (Number.isFinite(olflow)) {
          hasCheckedFlow.current = true;
          if (olflow > MAINTENANCE_NOTICE.flowUpperBound || olflow < 0) {
            setBannerMessage(MAINTENANCE_NOTICE.message);
          }
        }
      }

      setData({
        result: parsedData.result,
        onlineStatus: parsedData.result === 1 ? '在线' : '离线',
        account: parsedData.uid || '-',
        name: parsedData.NID || '-',
        ipAddress: parsedData.v4ip || parsedData.v46ip || '-',
        macAddress: hasValue(parsedData.olmac) ? formatMacAddress(parsedData.olmac) : '-',
        remainingFlow: hasValue(parsedData.olflow) ? formatBytes(parsedData.olflow) : '-',
        remainingFee: hasValue(parsedData.fee) ? formatFee(parsedData.fee) : '-',
        terminalType,
        v4ip: parsedData.v4ip,
        v46ip: parsedData.v46ip,
      });
    } catch {
      // 清理阶段取消的旧请求不应覆盖新组件实例的数据。
      if (requestControllerRef.current === controller) {
        setData({
          result: 0,
          onlineStatus: '未连接到校园网'
        });
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        isLoadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(loadData, 0);
    const interval = setInterval(loadData, 3000);
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(interval);
      const activeController = requestControllerRef.current;
      requestControllerRef.current = null;
      isLoadingRef.current = false;
      activeController?.abort();
    };
  }, [loadData]);

  // 横幅自动关闭
  useEffect(() => {
    if (bannerMessage) {
      const timer = setTimeout(() => setBannerMessage(null), MAINTENANCE_NOTICE.duration);
      return () => clearTimeout(timer);
    }
  }, [bannerMessage]);

  return { data, loadData, bannerMessage, dismissBanner };
}
