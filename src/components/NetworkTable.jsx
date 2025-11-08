function NetworkTable({ data }) {
  return (
    <table>
      <tbody>
        <tr>
          <th>登录状态</th>
          <td id="onlineStatus">{data?.onlineStatus || '-'}</td>
        </tr>
        <tr>
          <th>账号</th>
          <td id="account">{data?.result === 1 ? data?.account : '-'}</td>
        </tr>
        <tr>
          <th>姓名</th>
          <td id="name">{data?.result === 1 ? data?.name : '-'}</td>
        </tr>
        <tr>
          <th>剩余流量</th>
          <td id="remainingFlow">{data?.result === 1 ? data?.remainingFlow : '-'}</td>
        </tr>
        <tr>
          <th>账户余额</th>
          <td id="remainingFee">{data?.result === 1 ? data?.remainingFee : '-'}</td>
        </tr>
        <tr>
          <th>终端类型</th>
          <td id="terminalType">{data?.result === 1 ? data?.terminalType : '-'}</td>
        </tr>
        <tr>
          <th>IP 地址</th>
          <td id="ipAddress">{data?.result === 1 ? data?.ipAddress : '-'}</td>
        </tr>
        <tr>
          <th>MAC 地址</th>
          <td id="macAddress">{data?.result === 1 ? data?.macAddress : '-'}</td>
        </tr>
      </tbody>
    </table>
  );
}

export default NetworkTable;
