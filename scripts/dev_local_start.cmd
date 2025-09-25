@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul
set "REPO_ROOT=%CD%"
set "STATE_FILE=%REPO_ROOT%\scripts\.dev_local_state"
set "CLOUDFLARED_LOG=%REPO_ROOT%\scripts\.cloudflared_tunnel.log"

if exist "%STATE_FILE%" (
  echo [DEV] Обнаружена активная сессия (scripts\dev_local_stop.cmd остановит её). Сначала выполните остановку.
  popd >nul
  exit /b 1
)

set "ENV_PATH=%REPO_ROOT%\.env.local"
if not exist "%ENV_PATH%" (
  if exist "%REPO_ROOT%\.env" (
    set "ENV_PATH=%REPO_ROOT%\.env"
  ) else (
    set "ENV_PATH="
  )
)

if defined ENV_PATH (
  set "DOTENV_CONFIG_PATH=%ENV_PATH%"
  echo [DEV] Используем переменные окружения из %ENV_PATH%
) else (
  set "DOTENV_CONFIG_PATH="
  echo [DEV] Файл .env.local не найден. Значения будут запрошены вручную.
)

set "ENV_PATH_VAR=%ENV_PATH%"
set "BOT_TOKEN="
if defined ENV_PATH_VAR (
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$path = $env:ENV_PATH_VAR; if ($path -and (Test-Path -LiteralPath $path)) { $pattern = '^[\s]*BOT_TOKEN[\s]*=[\s]*(.*)$'; foreach ($line in Get-Content -LiteralPath $path) { if ($line -match $pattern) { $value = $Matches[1].Trim(); if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) { $value = $value.Substring(1, $value.Length - 2) }; Write-Output $value; break } } }"`) do (
    set "BOT_TOKEN=%%I"
    goto :BOT_TOKEN_FOUND
  )
)
:BOT_TOKEN_FOUND

if not defined BOT_TOKEN (
  set /p "BOT_TOKEN=[WEBHOOK] Введите BOT_TOKEN: "
)

if not defined BOT_TOKEN (
  echo [WEBHOOK] Требуется BOT_TOKEN. Завершение.
  popd >nul
  exit /b 1
)

set "LOCAL_PORT="
if defined ENV_PATH_VAR (
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$path = $env:ENV_PATH_VAR; if ($path -and (Test-Path -LiteralPath $path)) { $pattern = '^[\s]*PORT[\s]*=[\s]*(.*)$'; foreach ($line in Get-Content -LiteralPath $path) { if ($line -match $pattern) { $value = $Matches[1].Trim(); if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) { $value = $value.Substring(1, $value.Length - 2) }; Write-Output $value; break } } }"`) do (
    set "LOCAL_PORT=%%I"
    goto :PORT_FOUND
  )
)
:PORT_FOUND

if not defined LOCAL_PORT (
  if defined PORT (
    set "LOCAL_PORT=%PORT%"
  ) else (
    set "LOCAL_PORT=8080"
  )
)

set "PORT=%LOCAL_PORT%"
echo [DEV] Локальный сервер будет слушать порт %PORT%

echo [TUNNEL] Проверяем доступные инструменты туннелирования...
set "TUNNEL_TOOL="
set "NGROK_PATH="
for /f "delims=" %%I in ('where ngrok 2^>nul') do if not defined NGROK_PATH set "NGROK_PATH=%%I"
if defined NGROK_PATH set "TUNNEL_TOOL=ngrok"
if not defined TUNNEL_TOOL (
  set "CLOUDFLARED_PATH="
  for /f "delims=" %%I in ('where cloudflared 2^>nul') do if not defined CLOUDFLARED_PATH set "CLOUDFLARED_PATH=%%I"
  if defined CLOUDFLARED_PATH set "TUNNEL_TOOL=cloudflared"
)
if not defined TUNNEL_TOOL (
  echo [TUNNEL] Не найден ни ngrok, ни cloudflared. Установите один из них и повторите попытку.
  popd >nul
  exit /b 1
)

echo [DEV] Запускаем бота: npm --workspace apps/bot run start
set "BOT_PID="
for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "$process = Start-Process -FilePath 'npm' -ArgumentList '--workspace','apps/bot','run','start' -WorkingDirectory '%REPO_ROOT%' -PassThru; $process.Id"`) do set "BOT_PID=%%I"

if not defined BOT_PID (
  echo [DEV] Не удалось запустить npm.
  goto :CLEANUP_FAIL
)

echo [DEV] PID локального бота: %BOT_PID%

powershell -NoProfile -Command "$port = %PORT%; for ($i=0; $i -lt 40; $i++) { try { Invoke-WebRequest -Uri ('http://127.0.0.1:' + $port + '/') -UseBasicParsing -TimeoutSec 2 ^| Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 500 } } exit 1"
if errorlevel 1 (
  echo [DEV] Сервер не отвечает на http://127.0.0.1:%PORT%/. Остановка.
  goto :CLEANUP_FAIL
)

echo [TUNNEL] Используем %TUNNEL_TOOL% для создания туннеля...
set "TUNNEL_PID="
set "PUBLIC_URL="
if "%TUNNEL_TOOL%"=="ngrok" (
  for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "$process = Start-Process -FilePath '%NGROK_PATH%' -ArgumentList 'http','%PORT%' -WorkingDirectory '%REPO_ROOT%' -PassThru; $process.Id"`) do set "TUNNEL_PID=%%I"
  if not defined TUNNEL_PID (
    echo [TUNNEL] Не удалось запустить ngrok.
    goto :CLEANUP_FAIL
  )
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { $res = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels'; $url = $res.tunnels ^| Where-Object { $_.proto -eq 'https' } ^| Select-Object -First 1 -ExpandProperty public_url; if ($url) { Write-Output $url; exit 0 } } catch { } Start-Sleep -Milliseconds 500 } exit 1"`) do set "PUBLIC_URL=%%I"
) else (
  if exist "%CLOUDFLARED_LOG%" del "%CLOUDFLARED_LOG%" >nul 2>&1
  for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "$logPath = '%CLOUDFLARED_LOG%'; $process = Start-Process -FilePath '%CLOUDFLARED_PATH%' -ArgumentList 'tunnel','--url','http://localhost:%PORT%','--no-autoupdate' -WorkingDirectory '%REPO_ROOT%' -RedirectStandardOutput $logPath -RedirectStandardError $logPath -PassThru; $process.Id"`) do set "TUNNEL_PID=%%I"
  if not defined TUNNEL_PID (
    echo [TUNNEL] Не удалось запустить cloudflared.
    goto :CLEANUP_FAIL
  )
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$logPath = '%CLOUDFLARED_LOG%'; for ($i=0; $i -lt 60; $i++) { if (Test-Path -LiteralPath $logPath) { $match = Select-String -Path $logPath -Pattern 'https://[-A-Za-z0-9.]*trycloudflare.com' ^| Select-Object -Last 1; if ($match) { $value = $match.Matches[0].Value; if ($value) { Write-Output $value; exit 0 } } } Start-Sleep -Milliseconds 500 } exit 1"`) do set "PUBLIC_URL=%%I"
)

if not defined PUBLIC_URL (
  echo [TUNNEL] Не удалось получить публичный адрес туннеля.
  goto :CLEANUP_FAIL
)

echo [TUNNEL] Публичный адрес: %PUBLIC_URL%

set "WEBHOOK_PATH=/telegram/webhook"
set "PUBLIC_URL_STRIPPED=%PUBLIC_URL%"
if "%PUBLIC_URL_STRIPPED:~-1%"=="/" set "PUBLIC_URL_STRIPPED=%PUBLIC_URL_STRIPPED:~0,-1%"
set "WEBHOOK_URL=%PUBLIC_URL_STRIPPED%%WEBHOOK_PATH%"

echo [WEBHOOK] Настраиваем вебхук на %WEBHOOK_URL%
set "SET_RESULT="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "try { $response = Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/setWebhook?url=%WEBHOOK_URL%' -ErrorAction Stop; if ($response.ok) { Write-Output ok } else { Write-Output ($response ^| ConvertTo-Json -Depth 5); exit 1 } } catch { Write-Output $_.Exception.Message; exit 1 }"`) do set "SET_RESULT=%%I"
if not defined SET_RESULT (
  echo [WEBHOOK] Не удалось получить ответ от Telegram при установке вебхука.
  goto :CLEANUP_FAIL
)
if /i not "%SET_RESULT%"=="ok" (
  echo [WEBHOOK] Ошибка установки вебхука: %SET_RESULT%
  goto :CLEANUP_FAIL
)

echo [WEBHOOK] Вебхук успешно обновлён.
set "ACTIVE_WEBHOOK="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "try { $info = Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo' -ErrorAction Stop; if ($info.url) { Write-Output $info.url } else { Write-Output '<empty>' } } catch { Write-Output '<empty>' }"`) do set "ACTIVE_WEBHOOK=%%I"
if /i "%ACTIVE_WEBHOOK%"=="<empty>" (
  echo [WEBHOOK] Текущий вебхук: (пусто)
) else if defined ACTIVE_WEBHOOK (
  echo [WEBHOOK] Текущий вебхук: %ACTIVE_WEBHOOK%
)

(
  echo BOT_PID=%BOT_PID%
  echo TUNNEL_PID=%TUNNEL_PID%
  echo TUNNEL_TOOL=%TUNNEL_TOOL%
  echo PUBLIC_URL=%PUBLIC_URL%
  echo WEBHOOK_URL=%WEBHOOK_URL%
  if "%TUNNEL_TOOL%"=="cloudflared" echo TUNNEL_LOG=%CLOUDFLARED_LOG%
) >"%STATE_FILE%"

echo [DEV] Готово! Туннель и вебхук настроены. Используйте scripts\dev_local_stop.cmd для остановки.

popd >nul
exit /b 0

:CLEANUP_FAIL
if defined TUNNEL_PID (
  for /f "tokens=*" %%P in ("%TUNNEL_PID%") do taskkill /PID %%P /T /F >nul 2>&1
)
if defined BOT_PID (
  for /f "tokens=*" %%P in ("%BOT_PID%") do taskkill /PID %%P /T /F >nul 2>&1
)
if exist "%STATE_FILE%" del "%STATE_FILE%" >nul 2>&1
if exist "%CLOUDFLARED_LOG%" del "%CLOUDFLARED_LOG%" >nul 2>&1
popd >nul
exit /b 1
