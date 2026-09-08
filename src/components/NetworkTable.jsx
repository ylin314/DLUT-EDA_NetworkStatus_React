import { useState } from "react";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { maskAccount, maskIp, maskMac } from "../utils/maskers";

function ValueWithReveal({ value, mask }) {
  const [isVisible, setIsVisible] = useState(false);
  const hasValue = value != null && value !== "" && value !== "-";

  return (
    <span className="info-value-row">
      {hasValue && (
        <button
          className="reveal-btn"
          onClick={() => setIsVisible((visible) => !visible)}
          title={isVisible ? "点击以隐藏完整信息" : "点击以显示完整信息"}
          aria-label={isVisible ? "点击以隐藏完整信息" : "点击以显示完整信息"}
        >
          {isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        </button>
      )}
      <span className="info-value">{hasValue ? (isVisible ? value : mask(value)) : '-'}</span>
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
          <th>IP地址</th>
          <td id="ipAddress"><ValueWithReveal value={data?.result === 1 ? data?.ipAddress : '-'} mask={maskIp} /></td>
        </tr>
        <tr>
          <th>MAC地址</th>
          <td id="macAddress"><ValueWithReveal value={data?.result === 1 ? data?.macAddress : '-'} mask={maskMac} /></td>
        </tr>
      </tbody>
    </table>
  );
}

export default NetworkTable;
