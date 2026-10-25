@echo off
REM Batch wrapper to launch the PowerShell orchestrator with bypassed execution policy
powershell -ExecutionPolicy Bypass -File "%~dp0run_all.ps1"
pause
