import { useEffect, useRef } from "react";
import { Modal, message } from "antd";
import {
  SELF_LOGOUT_URL,
  buildLoginUrl,
  buildSelfServiceUrl,
  fetchDrcomStatus,
} from "../services/campusNetwork";

const AUTH_WINDOW_NAME = "dlutCampusAuth";
const SELF_SSO_URL = buildSelfServiceUrl();
const LOGOUT_HOP_MS = 600;
const LOGIN_WAIT_WARNING_MS = 25000;
const LOGOUT_FAILED_URL = `${import.meta.env.BASE_URL}logout-failed.html`;
const LOGOUT_CHECK_TIMEOUT_MS = 2500;
const LOGOUT_CHECK_INTERVAL_MS = 400;

function waitUntilLoggedOut(timeoutMs = LOGOUT_CHECK_TIMEOUT_MS, intervalMs = LOGOUT_CHECK_INTERVAL_MS) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      fetchDrcomStatus()
        .then((payload) => {
          if (payload.result !== 1) {
            resolve(true);
            return;
          }
          if (Date.now() - startedAt >= timeoutMs) {
            resolve(false);
            return;
          }
          window.setTimeout(tick, intervalMs);
        })
        .catch(() => {
          if (Date.now() - startedAt >= timeoutMs) {
            resolve(false);
            return;
          }
          window.setTimeout(tick, intervalMs);
        });
    };
    window.setTimeout(tick, intervalMs);
  });
}

function writePreparingPage(win, title, hint) {
  try {
    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      font-family: "Microsoft YaHei", sans-serif;
      text-align: center;
      padding: 48px 16px;
      color: #333;
      background: #f7f9fc;
    }
  </style>
</head>
<body>
  <h2>${title}</h2>
  <p>${hint}</p>
</body>
</html>`);
    win.document.close();
  } catch {
    // 部分浏览器会限制对 about:blank 的写入，忽略即可
  }
}

function ActionButtons({ data }) {
  const awaitingLoginRef = useRef(false);
  const warningTimerRef = useRef(null);
  const operationControllerRef = useRef(null);
  const navigationTimersRef = useRef(new Set());

  const clearWarningTimer = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  };

  const clearNavigationTimers = () => {
    navigationTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    navigationTimersRef.current.clear();
  };

  const beginOperation = () => {
    awaitingLoginRef.current = false;
    clearWarningTimer();
    operationControllerRef.current?.abort();
    clearNavigationTimers();
    const controller = new AbortController();
    operationControllerRef.current = controller;
    return controller;
  };

  useEffect(() => {
    if (awaitingLoginRef.current && data?.onlineStatus === "在线") {
      message.success({ content: "校园网已登录", key: "campus-login" });
      awaitingLoginRef.current = false;
      clearWarningTimer();
    }
  }, [data?.onlineStatus]);

  useEffect(() => () => {
    awaitingLoginRef.current = false;
    clearWarningTimer();
    clearNavigationTimers();
    operationControllerRef.current?.abort();
  }, []);

  const showPopupBlocked = (url) => {
    Modal.warning({
      title: "弹出窗口被阻止，建议更换Edge或Chrome浏览器",
      content: (
        <div>
          <p>或点击下方链接手动跳转:</p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </div>
      ),
      okText: "确定",
    });
  };

  const openWindowWithFallback = (url) => {
    const newWindow = window.open(url, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      showPopupBlocked(url);
    }
  };

  const openAuthWindow = (title, hint) => {
    const authWindow = window.open("about:blank", AUTH_WINDOW_NAME);
    if (!authWindow || authWindow.closed || typeof authWindow.closed === "undefined") {
      return null;
    }
    writePreparingPage(authWindow, title, hint);
    return authWindow;
  };

  const navigateAuthWindow = (authWindow, url) => {
    try {
      authWindow.location.href = url;
      return true;
    } catch {
      const reused = window.open(url, AUTH_WINDOW_NAME);
      if (!reused || reused.closed || typeof reused.closed === "undefined") {
        return false;
      }
      return true;
    }
  };

  const hopAuthWindow = (authWindow, urls, signal) => {
    if (!authWindow || !urls.length) {
      return false;
    }
    if (!navigateAuthWindow(authWindow, urls[0])) {
      return false;
    }
    urls.slice(1).forEach((url, index) => {
      const timer = window.setTimeout(() => {
        navigationTimersRef.current.delete(timer);
        if (!signal?.aborted) navigateAuthWindow(authWindow, url);
      }, LOGOUT_HOP_MS * (index + 1));
      navigationTimersRef.current.add(timer);
    });
    return true;
  };

  const watchLoginResult = () => {
    awaitingLoginRef.current = true;
    clearWarningTimer();
    warningTimerRef.current = window.setTimeout(() => {
      if (awaitingLoginRef.current) {
        message.warning({
          content: "仍未连接校园网，请重新登录",
          key: "campus-login",
          duration: 6,
        });
      }
    }, LOGIN_WAIT_WARNING_MS);
  };

  const openLoginPage = (authWindow, loginUrl) => {
    message.loading({
      content: "正在打开登录页…",
      key: "campus-login",
      duration: 2,
    });
    if (!navigateAuthWindow(authWindow, loginUrl)) {
      showPopupBlocked(loginUrl);
      return;
    }
    watchLoginResult();
  };

  const startLoginHop = (authWindow, loginUrl, signal) => {
    message.loading({
      content: "正在打开登录页…",
      key: "campus-login",
      duration: 2,
    });

    // 先顶层访问自助服务注销接口，清掉会短路网关登录的旧会话。
    // 若本来就没有自助服务会话，这里可能返回 500，随后会立刻跳走，用户不会停在错误页。
    if (!hopAuthWindow(authWindow, [SELF_LOGOUT_URL, loginUrl], signal)) {
      showPopupBlocked(loginUrl);
      return;
    }

    watchLoginResult();
  };

  const startCampusLogin = () => {
    const controller = beginOperation();
    // 必须在点击事件里先打开窗口，后续异步跳转才不容易被拦截
    const authWindow = openAuthWindow("正在准备校园网登录", "请不要关闭此窗口");
    if (!authWindow) {
      const ip = data?.v4ip || data?.v46ip;
      if (ip) {
        showPopupBlocked(buildLoginUrl(ip));
      } else {
        Modal.warning({
          title: "弹出窗口被阻止，建议更换Edge或Chrome浏览器",
          content: "请允许弹出窗口后重新点击「跳转登录」",
          okText: "确定",
        });
      }
      return;
    }

    const ip = data?.v4ip || data?.v46ip;
    if (ip) {
      startLoginHop(authWindow, buildLoginUrl(ip), controller.signal);
      return;
    }

    fetchDrcomStatus({ signal: controller.signal })
      .then((parsedData) => {
        if (controller.signal.aborted) return;
        const resolvedIp = parsedData.v4ip || parsedData.v46ip;
        if (!resolvedIp) {
          message.error("获取IP失败: 未连接校园网或代理服务器有问题");
          authWindow.close();
          return;
        }
        startLoginHop(authWindow, buildLoginUrl(resolvedIp), controller.signal);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        message.error("获取IP失败: 未连接校园网或代理服务器有问题");
        console.error("获取IP失败: ", err);
        authWindow.close();
      });
  };

  const showLogoutFailedPage = (authWindow) => {
    try {
      authWindow?.close();
    } catch {
      // 跨域窗口 close 一般可用；失败时用同名窗口覆盖
    }
    const promptWindow = window.open(LOGOUT_FAILED_URL, AUTH_WINDOW_NAME);
    if (!promptWindow || promptWindow.closed || typeof promptWindow.closed === "undefined") {
      showPopupBlocked(LOGOUT_FAILED_URL);
    }
  };

  const handleLogin = () => {
    if (data?.onlineStatus === "在线") {
      Modal.warning({
        title: "无需登录",
        content: "已登录校园网",
        okText: "确定",
      });
      return;
    }

    startCampusLogin();
  };

  const handleSelfService = () => {
    if (data?.onlineStatus !== "在线") {
      Modal.warning({
        title: "无法访问账户明细",
        content: "未登录校园网",
        okText: "确定",
      });
      return;
    }

    openWindowWithFallback(SELF_SSO_URL);
  };

  const handleLogout = () => {
    const authWindow = openAuthWindow("正在注销校园网", "请不要关闭此窗口");
    if (!authWindow) {
      showPopupBlocked(SELF_LOGOUT_URL);
      return;
    }

    if (!navigateAuthWindow(authWindow, SELF_LOGOUT_URL)) {
      showPopupBlocked(SELF_LOGOUT_URL);
      return;
    }

    message.loading({ content: "正在注销…", key: "campus-logout", duration: 2 });

    waitUntilLoggedOut().then((loggedOut) => {
      if (!loggedOut) {
        showLogoutFailedPage(authWindow);
        return;
      }

      const ip = data?.v4ip || data?.v46ip;
      if (ip) {
        openLoginPage(authWindow, buildLoginUrl(ip));
        return;
      }

      fetchDrcomStatus()
        .then((parsedData) => {
          const resolvedIp = parsedData.v4ip || parsedData.v46ip;
          if (!resolvedIp) {
            showPopupBlocked(SELF_SSO_URL);
            return;
          }
          openLoginPage(authWindow, buildLoginUrl(resolvedIp));
        })
        .catch(() => {
          startCampusLogin();
        });
    });
  };

  const handlePay = () => {
    Modal.confirm({
      title: "注意",
      content: (
        <div>
          充值网费时需选择“开发区校区”！
        </div>
      ),
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        const payUrl = "http://ecardpayment.dlut.edu.cn/";
        openWindowWithFallback(payUrl);
      },
    });
  };

  return (
    <div className="button-container">
      <button id="loginBtn" onClick={handleLogin}>跳转登录</button>
      <button id="logoutBtn" onClick={handleLogout}>注销登录</button>
      <button id="selfServiceBtn" onClick={handleSelfService}>账户明细</button>
      <button id="payBtn" onClick={handlePay}>网费充值</button>
    </div>
  );
}

export default ActionButtons;
