import { useEffect, useRef } from 'react';

const SAKANA_SCRIPT_URL = `${import.meta.env.BASE_URL}sakana/sakana.min.js`;

function makeUnmountSafe(instance) {
  const originalUnmount = instance.unmount;
  let unmounted = false;

  instance.unmount = () => {
    // Sakana 自带的 unmount 只移除 DOM 和事件监听器，不会停止动画循环，
    // 也不会清除自动模式的定时器。先停止它们，避免卸载后的实例继续运行。
    instance._running = false;
    window.clearTimeout(instance._magicForceTimeout);
    instance._magicForceTimeout = 0;
    instance._magicForceEnabled = false;

    if (unmounted || !instance._domWrapper?.parentNode) {
      return instance;
    }

    unmounted = true;
    return originalUnmount();
  };

  return instance;
}

function SakanaWidget() {
  const widgetRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    const host = widgetRef.current;
    let cancelled = false;
    let script = null;
    let ownsScript = false;

    const mountWidget = () => {
      if (cancelled || !window.SakanaWidget || !host) {
        return;
      }

      // Sakana 的 mount 会替换传入节点，因此使用 React 容器内部的临时节点，
      // 避免第三方库直接替换 React 自己管理的 DOM。
      const mountPoint = document.createElement('div');
      host.appendChild(mountPoint);

      const instance = makeUnmountSafe(new window.SakanaWidget({}));
      instance.mount(mountPoint);
      instanceRef.current = instance;
    };

    const handleScriptError = () => {
      console.error('Sakana Widget 脚本加载失败');
      if (script?.isConnected) script.remove();
    };

    if (window.SakanaWidget) {
      mountWidget();
    } else {
      script = document.querySelector('script[data-sakana-widget]');

      if (!script) {
        script = document.createElement('script');
        script.src = SAKANA_SCRIPT_URL;
        script.async = true;
        script.dataset.sakanaWidget = 'true';
        document.body.appendChild(script);
        ownsScript = true;
      }

      script.addEventListener('load', mountWidget);
      script.addEventListener('error', handleScriptError);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', mountWidget);
      script?.removeEventListener('error', handleScriptError);

      if (instanceRef.current) {
        instanceRef.current.unmount();
        instanceRef.current = null;
      }

      host?.replaceChildren();

      if (ownsScript && script?.isConnected) {
        script.remove();
      }
    };
  }, []);

  return (
    <div
      ref={widgetRef}
      id="sakana-widget"
      className="sakana-float"
      style={{
        position: 'fixed',
        right: '40px',
        bottom: '40px',
        zIndex: 5
      }}
    />
  );
}

export default SakanaWidget;
