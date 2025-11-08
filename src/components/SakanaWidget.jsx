import { useEffect, useRef } from 'react';

function SakanaWidget() {
  const widgetRef = useRef(null);

  useEffect(() => {
    // 动态加载 Sakana Widget 脚本
    const script = document.createElement('script');
    script.src = '/sakana/sakana.min.js';
    script.async = true;

    script.onload = () => {
      if (window.SakanaWidget && widgetRef.current) {
        new window.SakanaWidget({}).mount(widgetRef.current);
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
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
