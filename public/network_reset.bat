REM v0.0.3
@echo off
chcp 65001 >nul
:: 网络设置重置工具 - Windows版本

:: =================================================================
:: 1. 检查并获取管理员权限
:: =================================================================
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' neq '0' (
    echo 正在请求管理员权限...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: =================================================================
:: 主程序开始
:: =================================================================
title 网络设置重置工具

:main
:: =================================================================
:: 清除系统代理
:: =================================================================
echo.
echo 正在清除系统代理...
echo -----------------------------------------------------------------
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /f >nul 2>nul
netsh winhttp reset proxy >nul
echo 系统代理已清除。
echo.

:: =================================================================
:: 将所有DNS设置为自动获取
:: =================================================================
echo 正在将 DNS 设置为自动获取...
echo -----------------------------------------------------------------
for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "Get-NetAdapter -Physical | Where-Object {$_.Status -eq 'Up'} | Select-Object -ExpandProperty Name"`) do (
    echo 正在为 [%%a] 设置DNS为自动获取...
    netsh interface ip set dnsservers name="%%a" source=dhcp >nul
)
echo 所有已连接的网络适配器DNS已设置为自动获取。
echo.

:: =================================================================
:: 重置网络设置
:: =================================================================
echo 正在重置网络设置...
echo -----------------------------------------------------------------
netsh winsock reset
ipconfig /release
ipconfig /renew

echo 正在等待生效...
echo -----------------------------------------------------------------
ping -n 5 127.0.0.1 >nul
echo.

:end
:: =================================================================
:: 结束
:: =================================================================

echo.
echo =================================================================
echo  所有任务已完成！请重新连接校园网！
echo  大连理工大学“凌锐派”科技服务队
echo =================================================================
echo.
pause
exit