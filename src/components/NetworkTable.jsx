import { useState } from "react";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

function maskAccount(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length <= 6) return "******";
  const tailCount = Math.min(text.length - 6, 2);
  const headCount = Math.min(text.length - 7, 4);
  return `${text.slice(0, headCount)}******${text.slice(-tailCount)}`;
}

function maskIp(value) {
  if (!value) return "-";
  const parts = String(value).split('.');
  if (parts.length !== 4) return value;
  return `${parts[0]}.${parts[1]}.**.**`;
}

function maskMac(value) {
  if (!value) return "-";
  const parts = String(value).split('-');
  if (parts.length < 5) return value;
  return [parts[0], parts[1], "**", "**", "**", parts[parts.length - 1]].join('-');
}

function ValueWithReveal({ value, mask }) {
  const [revealed, setRevealed] = useState(false);
  const hasValue = value != null && value !== "" && value !== "-";

  return (
    <span className="info-value-row">
      {hasValue && (
        <button
          className="reveal-btn"
          onClick={() => setRevealed((r) => !r)}
          title={revealed ? "隐藏" : "显示完整信息"}
          aria-label={revealed ? "隐藏" : "显示完整信息"}
        >
          {revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        </button>
      )}
      <span className="info-value">{hasValue ? (revealed ? value : mask(value)) : '-'}</span>
    </span>
  );
}

function NetworkTable({ data }) {
  return (
    <table className="status-table">
      <tbody>
        <tr>
          <th>登录状态</th>
          <td
            id="onlineStatus"
            className={data?.onlineStatus === "在线" ? "status-online" : data?.onlineStatus ? "status-offline" : undefined}
          >
            {data?.onlineStatus || "-"}
          </td>
        </tr>
        <tr>
          <th>账号</th>
          <td id="account"><ValueWithReveal value={data?.result === 1 ? data?.account : '-'} mask={maskAccount} /></td>
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
          <td id="ipAddress"><ValueWithReveal value={data?.result === 1 ? data?.ipAddress : '-'} mask={maskIp} /></td>
        </tr>
        <tr>
          <th>MAC 地址</th>
          <td id="macAddress"><ValueWithReveal value={data?.result === 1 ? data?.macAddress : '-'} mask={maskMac} /></td>
        </tr>
      </tbody>
    </table>
  );
}

export default NetworkTable;
