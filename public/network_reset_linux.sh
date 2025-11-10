#!/bin/bash
# v0.0.3
# 网络设置重置工具 - Linux版本

# =================================================================
# 错误处理
# =================================================================
set -e  # 遇到错误立即退出
trap 'error_handler $? $LINENO' ERR  # 捕获错误

# =================================================================
# 颜色定义
# =================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =================================================================
# 错误处理函数
# =================================================================
error_handler() {
    echo ""
    echo -e "${RED}错误：脚本在第 $2 行执行失败（退出码: $1）${NC}"
    echo -e "${YELLOW}请检查系统环境或以管理员权限重新运行此脚本。${NC}"
    echo ""
    exit $1
}

# =================================================================
# 1. 检查操作系统
# =================================================================
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${RED}错误：此脚本仅支持 Linux 系统${NC}"
    exit 1
fi

# =================================================================
# 2. 检查并获取管理员权限
# =================================================================
if [ "$EUID" -ne 0 ]; then 
    echo "正在请求管理员权限..."
    if ! sudo "$0" "$@"; then
        echo -e "${RED}错误：无法获取管理员权限${NC}"
        exit 1
    fi
    exit $?
fi

# =================================================================
# 检测网络管理工具
# =================================================================
detect_network_manager() {
    if command -v nmcli &> /dev/null; then
        echo "NetworkManager"
    elif command -v systemctl &> /dev/null && systemctl is-active --quiet systemd-networkd; then
        echo "systemd-networkd"
    else
        echo "none"
    fi
}

NETWORK_MANAGER=$(detect_network_manager)

# =================================================================
# 主程序开始
# =================================================================
clear
echo "========================================"
echo "    网络设置重置工具 - Linux"
echo "========================================"
echo "检测到的网络管理器: $NETWORK_MANAGER"
echo ""

main() {
    # =================================================================
    # 清除系统代理
    # =================================================================
    echo ""
    echo "正在清除系统代理..."
    echo "-----------------------------------------------------------------"
    
    # 清除环境变量中的代理设置
    unset http_proxy
    unset https_proxy
    unset ftp_proxy
    unset all_proxy
    unset HTTP_PROXY
    unset HTTPS_PROXY
    unset FTP_PROXY
    unset ALL_PROXY
    
    # 清除GNOME代理设置（如果存在）
    if command -v gsettings &> /dev/null; then
        echo "正在清除 GNOME 代理设置..."
        gsettings set org.gnome.system.proxy mode 'none' 2>/dev/null || echo -e "${YELLOW}警告：清除GNOME代理失败${NC}"
    fi
    
    # 清除KDE代理设置（如果存在）
    if [ -f "$HOME/.config/kioslaverc" ]; then
        echo "正在清除 KDE 代理设置..."
        sed -i '/ProxyType/d' "$HOME/.config/kioslaverc" 2>/dev/null || echo -e "${YELLOW}警告：清除KDE代理失败${NC}"
    fi
    
    echo -e "${GREEN}系统代理已清除。${NC}"
    echo ""

    # =================================================================
    # 将所有DNS设置为自动获取
    # =================================================================
    echo "正在将 DNS 设置为自动获取..."
    echo "-----------------------------------------------------------------"
    
    if [ "$NETWORK_MANAGER" == "NetworkManager" ]; then
        # 使用 NetworkManager
        connections=$(nmcli -t -f NAME,TYPE connection show | grep -E 'ethernet|wifi' | cut -d: -f1)
        
        if [ -z "$connections" ]; then
            echo -e "${YELLOW}警告：未找到任何网络连接${NC}"
        else
            while IFS= read -r conn; do
                if [ ! -z "$conn" ]; then
                    echo "正在为 [$conn] 设置DNS为自动获取..."
                    if ! nmcli connection modify "$conn" ipv4.dns "" 2>/dev/null || \
                       ! nmcli connection modify "$conn" ipv4.ignore-auto-dns no 2>/dev/null; then
                        echo -e "${YELLOW}警告：设置 [$conn] DNS失败，继续执行...${NC}"
                    fi
                fi
            done <<< "$connections"
        fi
    elif [ "$NETWORK_MANAGER" == "systemd-networkd" ]; then
        # 使用 systemd-networkd
        echo "正在清除 systemd-resolved DNS 设置..."
        if [ -f "/etc/systemd/resolved.conf" ]; then
            sed -i 's/^DNS=/#DNS=/g' /etc/systemd/resolved.conf 2>/dev/null || echo -e "${YELLOW}警告：修改resolved.conf失败${NC}"
        fi
    else
        # 直接修改 /etc/resolv.conf
        echo "正在备份并清空 /etc/resolv.conf..."
        if [ -f "/etc/resolv.conf" ] && [ ! -L "/etc/resolv.conf" ]; then
            cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo -e "${YELLOW}警告：备份resolv.conf失败${NC}"
            echo "# DNS will be set by DHCP" > /etc/resolv.conf 2>/dev/null || echo -e "${YELLOW}警告：清空resolv.conf失败${NC}"
        fi
    fi
    
    echo -e "${GREEN}所有网络适配器DNS已设置为自动获取。${NC}"
    echo ""

    # =================================================================
    # 重置网络设置
    # =================================================================
    echo "正在重置网络设置..."
    echo "-----------------------------------------------------------------"
    
    # 刷新DNS缓存
    echo "正在刷新DNS缓存..."
    if command -v systemd-resolve &> /dev/null; then
        if ! systemd-resolve --flush-caches 2>/dev/null; then
            echo -e "${YELLOW}警告：刷新 systemd-resolve 缓存失败${NC}"
        fi
    elif command -v resolvectl &> /dev/null; then
        if ! resolvectl flush-caches 2>/dev/null; then
            echo -e "${YELLOW}警告：刷新 resolvectl 缓存失败${NC}"
        fi
    elif command -v nscd &> /dev/null; then
        if ! nscd -i hosts 2>/dev/null; then
            echo -e "${YELLOW}警告：刷新 nscd 缓存失败${NC}"
        fi
    fi
    
    # 重启网络服务
    echo "正在重启网络服务..."
    if [ "$NETWORK_MANAGER" == "NetworkManager" ]; then
        if ! systemctl restart NetworkManager 2>/dev/null; then
            echo -e "${YELLOW}警告：重启 NetworkManager 失败${NC}"
            # 尝试重新加载连接
            nmcli connection reload 2>/dev/null || echo -e "${YELLOW}警告：重新加载连接失败${NC}"
        else
            echo -e "${GREEN}NetworkManager 已重启${NC}"
        fi
    elif [ "$NETWORK_MANAGER" == "systemd-networkd" ]; then
        if ! systemctl restart systemd-networkd 2>/dev/null; then
            echo -e "${YELLOW}警告：重启 systemd-networkd 失败${NC}"
        else
            echo -e "${GREEN}systemd-networkd 已重启${NC}"
        fi
        if command -v systemd-resolved &> /dev/null; then
            systemctl restart systemd-resolved 2>/dev/null || echo -e "${YELLOW}警告：重启 systemd-resolved 失败${NC}"
        fi
    else
        # 尝试使用传统的网络服务命令
        if command -v service &> /dev/null; then
            service networking restart 2>/dev/null || echo -e "${YELLOW}警告：重启 networking 服务失败${NC}"
        fi
    fi
    
    # 获取主要网络接口并重新获取IP
    echo "正在重新获取网络配置..."
    primary_interface=$(ip route | grep default | awk '{print $5}' | head -n1)
    
    if [ -z "$primary_interface" ]; then
        echo -e "${YELLOW}警告：未找到主要网络接口，跳过接口重置${NC}"
    else
        echo "正在为主要网络接口 [$primary_interface] 重新获取IP..."
        
        if [ "$NETWORK_MANAGER" == "NetworkManager" ]; then
            # 使用 NetworkManager 重新连接
            connection=$(nmcli -t -f NAME,DEVICE connection show --active | grep "$primary_interface" | cut -d: -f1)
            if [ ! -z "$connection" ]; then
                nmcli connection down "$connection" 2>/dev/null || echo -e "${YELLOW}警告：断开连接失败${NC}"
                sleep 2
                if ! nmcli connection up "$connection" 2>/dev/null; then
                    echo -e "${YELLOW}警告：重新连接失败，网络可能需要手动重新连接${NC}"
                else
                    echo -e "${GREEN}连接已重新建立${NC}"
                fi
            fi
        else
            # 使用 dhclient 或 dhcpcd
            if command -v dhclient &> /dev/null; then
                dhclient -r "$primary_interface" 2>/dev/null || echo -e "${YELLOW}警告：释放DHCP租约失败${NC}"
                sleep 1
                if ! dhclient "$primary_interface" 2>/dev/null; then
                    echo -e "${YELLOW}警告：重新获取DHCP失败${NC}"
                else
                    echo -e "${GREEN}DHCP地址已重新获取${NC}"
                fi
            elif command -v dhcpcd &> /dev/null; then
                dhcpcd -k "$primary_interface" 2>/dev/null || echo -e "${YELLOW}警告：停止dhcpcd失败${NC}"
                sleep 1
                if ! dhcpcd "$primary_interface" 2>/dev/null; then
                    echo -e "${YELLOW}警告：启动dhcpcd失败${NC}"
                else
                    echo -e "${GREEN}DHCP地址已重新获取${NC}"
                fi
            else
                # 使用 ip 命令重启接口
                ip link set "$primary_interface" down 2>/dev/null || echo -e "${YELLOW}警告：关闭网络接口失败${NC}"
                sleep 2
                if ! ip link set "$primary_interface" up 2>/dev/null; then
                    echo -e "${RED}错误：启动网络接口失败${NC}"
                    return 1
                else
                    echo -e "${GREEN}网络接口已重启${NC}"
                fi
            fi
        fi
    fi
    
    echo -e "${GREEN}网络设置已重置。${NC}"
    echo ""

    sleep 5
}

# =================================================================
# 执行主程序
# =================================================================
if ! main; then
    echo -e "${RED}程序执行过程中出现错误${NC}"
    exit 1
fi

# =================================================================
# 结束
# =================================================================
echo "================================================================="
echo -e " ${GREEN}所有任务已完成！请重新连接校园网！${NC}"
echo -e " ${GREEN}大连理工大学“凌锐派”科技服务队${NC}"
echo "================================================================="
echo ""
echo ""
echo "按任意键退出..."
read -n 1 -s
