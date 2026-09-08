/**
 * 横幅通知配置
 *
 * 设置 enabled 为 false 即可关闭对应通知，无需修改其他代码。
 */

// 校园网计费系统维护通知
// 当 olflow 超过 flowUpperBound 或小于 0 时触发
export const MAINTENANCE_NOTICE = {
  enabled: false, // 改为 false 即可关闭此通知
  flowUpperBound: 162529280,
  message: '校园网计费系统维护中，期间不影响使用，但无法正常显示剩余流量，恢复时间尚不明确',
  duration: 5000, // 显示时长（毫秒）
};
