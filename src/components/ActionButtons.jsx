import { Modal, message } from "antd";

function ActionButtons({ onRefresh }) {
  const handleLogin = () => {
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
        window.open(loginUrl, '_blank');
      })
      .catch(err => {
        message.error(`获取IP失败: 未连接校园网或代理服务器有问题`);
        console.error('获取IP失败: ', err);
      });
  };

  const handleSelfService = () => {
    const selfServiceUrl = 'https://sso.dlut.edu.cn/cas/login?service=http%3A%2F%2F172.20.30.2%3A8080%2FSelf%2Fsso_login';
    window.open(selfServiceUrl, '_blank');
  };


  const handleLogout = () => {
    Modal.confirm({
      title: "注销确认",
      content: (
        <div>
          单击确定后注销当前校园网账号，但请不要在新弹出的窗口进行登录操作，
          请重新进入 172.20.30.3 进行登录！如提示 500-内部错误，请重新登录后注销！
        </div>
      ),
      okText: "确定",
      cancelText: "取消",
      onOk: () => {
        window.open('http://172.20.30.2:8080/Self/login/logout', '_blank');
      },
    });
  };

  return (
    <div className="button-container">
      <button id="loginBtn" onClick={handleLogin}>跳转登录</button>
      <button id="logoutBtn" onClick={handleLogout}>注销本机</button>
      <button id="selfServiceBtn" onClick={handleSelfService}>账户明细</button>
      <button id="refreshBtn" onClick={onRefresh}>刷新数据</button>
    </div>
  );
}

export default ActionButtons;
