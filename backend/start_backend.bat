@echo off
chcp 65001 > nul
title MzPic AI Print Studio Backend (Port 5000)
echo ========================================================
echo  🚀 Đang khởi động MzPic Backend (ToolXPrint Engine)...
echo  Cổng API: http://127.0.0.1:5000
echo  Engine: OpenAI GPT / Google Gemini (Auto-Key from vps_go.md)
echo ========================================================
python "%~dp0server.py"
pause
