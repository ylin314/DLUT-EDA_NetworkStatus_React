#!/bin/bash
# v0.0.3
# 网络设置重置工具 - macOS版本

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
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}错误：此脚本仅支持 macOS 系统${NC}"
    echo -e "${YELLOW}提示：Linux 系统请使用对应的 Linux 版本脚本${NC}"
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
# 主程序开始
# =================================================================
clear
echo "========================================"
echo "    网络设置重置工具 - macOS"
echo "========================================"

main() {
    # =================================================================
    # 清除系统代理
    # =================================================================
    echo ""
    echo "正在清除系统代理..."
    echo "-----------------------------------------------------------------"
    
    # 获取所有网络服务
    if ! networkservices=$(networksetup -listallnetworkservices 2>/dev/null | grep -v "An asterisk"); then
        echo -e "${RED}错误：无法获取网络服务列表${NC}"
        return 1
    fi
    
    if [ -z "$networkservices" ]; then
        echo -e "${YELLOW}警告：未找到任何网络服务${NC}"
    else
        while IFS= read -r service; do
            if [ ! -z "$service" ]; then
                echo "正在清除 [$service] 的代理设置..."
                if ! networksetup -setwebproxystate "$service" off 2>/dev/null || \
                   ! networksetup -setsecurewebproxystate "$service" off 2>/dev/null || \
                   ! networksetup -setsocksfirewallproxystate "$service" off 2>/dev/null || \
                   ! networksetup -setftpproxystate "$service" off 2>/dev/null; then
                    echo -e "${YELLOW}警告：清除 [$service] 代理时出现部分错误，继续执行...${NC}"
                fi
            fi
        done <<< "$networkservices"
    fi
    
    echo -e "${GREEN}系统代理已清除。${NC}"
    echo ""

    # =================================================================
    # 将所有DNS设置为自动获取
    # =================================================================
    echo "正在将 DNS 设置为自动获取..."
    echo "-----------------------------------------------------------------"
    
    if [ -z "$networkservices" ]; then
        echo -e "${YELLOW}警告：没有可用的网络服务，跳过DNS设置${NC}"
    else
        while IFS= read -r service; do
            if [ ! -z "$service" ]; then
                echo "正在为 [$service] 设置DNS为自动获取..."
                if ! networksetup -setdnsservers "$service" "Empty" 2>/dev/null; then
                    echo -e "${YELLOW}警告：设置 [$service] DNS失败，继续执行...${NC}"
                fi
            fi
        done <<< "$networkservices"
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
    if ! dscacheutil -flushcache 2>/dev/null; then
        echo -e "${YELLOW}警告：刷新 dscacheutil 缓存失败${NC}"
    fi
    
    if ! killall -HUP mDNSResponder 2>/dev/null; then
        echo -e "${YELLOW}警告：重启 mDNSResponder 失败${NC}"
    fi
    
    # 获取主要网络接口（通常是en0或en1）
    primary_interface=$(route -n get default 2>/dev/null | grep 'interface:' | awk '{print $2}')
    
    if [ -z "$primary_interface" ]; then
        echo -e "${YELLOW}警告：未找到主要网络接口，跳过接口重置${NC}"
    else
        echo "正在为主要网络接口 [$primary_interface] 重新获取IP..."
        # 关闭并重新启动网络接口
        if ! ifconfig "$primary_interface" down 2>/dev/null; then
            echo -e "${YELLOW}警告：关闭网络接口失败${NC}"
        fi
        sleep 2
        if ! ifconfig "$primary_interface" up 2>/dev/null; then
            echo -e "${RED}错误：启动网络接口失败${NC}"
            return 1
        fi
        
        # 重新获取DHCP地址
        if ! ipconfig set "$primary_interface" DHCP 2>/dev/null; then
            echo -e "${YELLOW}警告：设置DHCP失败，网络可能需要手动重新连接${NC}"
        fi
    fi
    
    echo -e "${GREEN}网络设置已重置。${NC}"
    echo ""

    echo -e "${GREEN}请重新连接校园网。${NC}"
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
echo -e " ${GREEN}所有任务已完成！${NC}"
echo -e " ${GREEN}大连理工大学“凌锐派”科技服务队${NC}"
echo "================================================================="
echo "按任意键退出..."
read -n 1 -s
