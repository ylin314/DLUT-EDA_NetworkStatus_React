import { useState, useEffect } from 'react';

const BACKGROUND_INDEX_URL = `${import.meta.env.BASE_URL}background-images.json`;

// 将候选图打散，失败时可按顺序重试不同图片
function shuffleImages(images) {
  const list = [...images];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * 随机背景图 Hook
 * 注意：名称中的 Rotation 指页面刷新时切换背景图，而非定时轮换
 */
export function useBackgroundRotation() {
  // 初始为空字符串，待图片加载/解码完成后再应用背景，减少首屏闪烁
  const [currentBackground, setCurrentBackground] = useState('');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadAndApply = async () => {
      let list;

      try {
        const response = await fetch(BACKGROUND_INDEX_URL, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;

        list = await response.json();
        if (!Array.isArray(list)) return;
      } catch {
        return;
      }

      const images = list.filter((item) => typeof item === 'string' && item.length > 0);

      if (cancelled || images.length === 0) return;

      const candidates = shuffleImages(images);

      const tryLoad = (index) => {
        if (cancelled || index >= candidates.length) return;

        const src = candidates[index];
        const img = new Image();
        let settled = false;

        const cleanup = () => {
          img.onload = null;
          img.onerror = null;
        };

        const resolveAttempt = (success) => {
          if (settled) return;
          settled = true;
          cleanup();

          if (cancelled) return;

          if (success) {
            setCurrentBackground(src);
            return;
          }

          tryLoad(index + 1);
        };

        const applyIfValid = () => {
          resolveAttempt(img.naturalWidth > 0);
        };

        img.onload = applyIfValid;
        img.onerror = () => resolveAttempt(false);
        img.src = src;

        // decode 可提升首屏体验，但部分浏览器会出现 decode reject 且后续仍可 onload 的情况
        if (typeof img.decode === 'function') {
          img.decode().then(applyIfValid).catch(() => {
            // decode reject 时优先回退到 onload/onerror；若资源已 complete 则立即判定
            if (img.complete) {
              applyIfValid();
            }
          });
        } else if (img.complete) {
          applyIfValid();
        }
      };

      tryLoad(0);
    };

    loadAndApply();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return currentBackground;
}
