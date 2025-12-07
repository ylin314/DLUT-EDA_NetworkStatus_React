import { Modal, message } from "antd";

function ActionButtons({ data }) {
  const openWindowWithFallback = (url) => {
    const newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      Modal.warning({
        title: '弹出窗口被阻止，建议更换Edge或Chrome浏览器',
        content: (
          <div>
            <p>或点击下方链接手动跳转:</p>
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          </div>
        ),
        okText: '确定',
      });
    }
  };

  const handleLogin = () => {
    if (data?.onlineStatus === '在线') {
      Modal.warning({
        title: '无需登录',
        content: '已登录校园网',
        okText: '确定',
      });
      return;
    }

    fetch('http://172.20.30.1/drcom/chkstatus?callback=')
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        let decoder = new TextDecoder('gbk');
        let text = decoder.decode(arrayBuffer);
        let jsonText = "{" + text.split("({")[1].split("})")[0] + "}";
        let parsedData = JSON.parse(jsonText);

        let v4ip = parsedData.v4ip;
        let loginUrl = `https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login%3Fwlan_user_ip%3D${v4ip}%26authex_enable%3D%26type%3D1`;

        // 补救v4ip获取失败的情况
        if (!v4ip) {
          let v46ip = parsedData.v46ip;
          loginUrl = `https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login%3Fwlan_user_ip%3D${v46ip}%26authex_enable%3D%26type%3D1`;
        }

        console.log(loginUrl);
        openWindowWithFallback(loginUrl);
      })
      .catch(err => {
        message.error(`获取IP失败: 未连接校园网或代理服务器有问题`);
        console.error('获取IP失败: ', err);
      });
  };

  const handleSelfService = () => {
    // 检查在线状态
    if (data?.onlineStatus !== '在线') {
      Modal.warning({
        title: '无法访问账户明细',
        content: '未登录校园网',
        okText: '确定',
      });
      return;
    }

    const selfServiceUrl = 'https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login';
    openWindowWithFallback(selfServiceUrl);
  };


  const handleLogout = () => {
    // 检查在线状态
    // if (data?.onlineStatus !== '在线') {
    //   Modal.warning({
    //     title: '无法注销',
    //     content: '未登录校园网',
    //     okText: '确定',
    //   });
    //   return;
    // }

    Modal.confirm({
      title: "注销确认",
      content: (
        <div>
          单击确定后注销当前校园网账号，但请不要在新弹出的窗口进行登录操作，请重新进入 172.20.30.3 进行登录！
          如提示 500-内部错误，请点击“账户明细”进行一次登录后再注销！
        </div>
      ),
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        const logoutUrl = 'http://172.20.30.2:8080/Self/login/logout';
        openWindowWithFallback(logoutUrl);
      },
    });
  };

  const handlePay = () => {
    Modal.confirm({
      title: "校区确认",
      content: (
        <div>
          充值网费时请注意选择开发区校区！
        </div>
      ),
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        const payUrl = 'http://ecardpayment.dlut.edu.cn/';
        openWindowWithFallback(payUrl);
      },
    });
  }

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
