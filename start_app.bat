@echo off
chcp 65001 > nul
title MzPic AI Print Studio (ToolXPrint Edition)
echo ======================================================================
echo  🚀 Đang khởi động MzPic AI Print Studio...
echo  - Backend Python (ToolXPrint Engine): http://127.0.0.1:5000
echo  - Frontend ReactJS (Vite):             http://127.0.0.1:3000
echo ======================================================================

start "MzPic Backend API (5000)" cmd /k "cd /d %~dp0backend && python server.py"
timeout /t 2 /nobreak > nul
start "MzPic Frontend React (3000)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Đã khởi động cả Backend và Frontend!
echo Trình duyệt sẽ kết nối tại: http://localhost:3000
echo.
pause
