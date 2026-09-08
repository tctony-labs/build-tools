@echo off

setlocal

set PATH=%PATH%;%~dp0

:: Defer Control
node "%~dp0\xw" %*
