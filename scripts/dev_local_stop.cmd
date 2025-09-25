@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul
set "REPO_ROOT=%CD%"
set "STATE_FILE=%REPO_ROOT%\scripts\.dev_local_state"
set "CLOUDFLARED_LOG=%REPO_ROOT%\scripts\.cloudflared_tunnel.log"

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
) else (
  set "DOTENV_CONFIG_PATH="
)

set "ENV_PATH_VAR=%ENV_PATH%"
set "BOT_TOKEN="
if defined ENV_PATH_VAR (
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$path = $env:ENV_PATH_VAR; if ($path -and (Test-Path -LiteralPath $path)) { $pattern = '^[\s]*BOT_TOKEN[\s]*=[\s]*(.*)$'; foreach ($line in Get-Content -LiteralPath $path) { if ($line -match $pattern) { $value = $Matches[1].Trim(); if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) { $value = $value.Substring(1, $value.Length - 2) }; Write-Output $value; break } } }"`) do (
    set "BOT_TOKEN=%%I"
    goto :BOT_TOKEN_READY
  )
)
:BOT_TOKEN_READY

if not defined BOT_TOKEN (
  set /p "BOT_TOKEN=[WEBHOOK] Введите BOT_TOKEN для очистки вебхука: "
)

if not defined BOT_TOKEN (
  echo [WEBHOOK] Требуется BOT_TOKEN. Завершение.
  popd >nul
  exit /b 1
)

echo [WEBHOOK] Сбрасываем вебхук Telegram...
set "CLEAR_RESULT="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "try { $response = Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/setWebhook?url=' -ErrorAction Stop; if ($response.ok) { Write-Output ok } else { Write-Output ($response ^| ConvertTo-Json -Depth 5); exit 1 } } catch { Write-Output $_.Exception.Message; exit 1 }"`) do set "CLEAR_RESULT=%%I"
if not defined CLEAR_RESULT (
  echo [WEBHOOK] Не удалось получить ответ от Telegram при очистке вебхука.
  popd >nul
  exit /b 1
)
if /i not "%CLEAR_RESULT%"=="ok" (
  echo [WEBHOOK] Ошибка очистки вебхука: %CLEAR_RESULT%
  popd >nul
  exit /b 1
)

echo [WEBHOOK] Вебхук очищен.
set "ACTIVE_WEBHOOK="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "try { $info = Invoke-RestMethod -Uri 'https://api.telegram.org/bot%BOT_TOKEN%/getWebhookInfo' -ErrorAction Stop; if ($info.url) { Write-Output $info.url } else { Write-Output '<empty>' } } catch { Write-Output '<empty>' }"`) do set "ACTIVE_WEBHOOK=%%I"
if /i "%ACTIVE_WEBHOOK%"=="<empty>" (
  echo [WEBHOOK] Текущий вебхук: (пусто)
) else if defined ACTIVE_WEBHOOK (
  echo [WEBHOOK] Текущий вебхук: %ACTIVE_WEBHOOK%
)

set "BOT_PID="
set "TUNNEL_PID="
set "TUNNEL_TOOL="
set "TUNNEL_LOG_PATH="
if exist "%STATE_FILE%" (
  for /f "usebackq tokens=1,2 delims==" %%A in ("%STATE_FILE%") do (
    if /i "%%A"=="BOT_PID" set "BOT_PID=%%B"
    if /i "%%A"=="TUNNEL_PID" set "TUNNEL_PID=%%B"
    if /i "%%A"=="TUNNEL_TOOL" set "TUNNEL_TOOL=%%B"
    if /i "%%A"=="TUNNEL_LOG" set "TUNNEL_LOG_PATH=%%B"
  )
) else (
  echo [DEV] Файл состояния не найден — завершаем только вебхук.
)

if defined TUNNEL_PID (
  for /f "tokens=*" %%P in ("%TUNNEL_PID%") do (
    taskkill /PID %%P /T /F >nul 2>&1
    echo [TUNNEL] Остановлен процесс туннеля (PID %%P).
  )
) else (
  echo [TUNNEL] PID туннеля не найден.
)

if defined BOT_PID (
  for /f "tokens=*" %%P in ("%BOT_PID%") do (
    taskkill /PID %%P /T /F >nul 2>&1
    echo [DEV] Остановлен локальный бот (PID %%P).
  )
) else (
  echo [DEV] PID локального бота не найден.
)

if defined TUNNEL_LOG_PATH if exist "%TUNNEL_LOG_PATH%" del "%TUNNEL_LOG_PATH%" >nul 2>&1
if exist "%CLOUDFLARED_LOG%" del "%CLOUDFLARED_LOG%" >nul 2>&1
if exist "%STATE_FILE%" del "%STATE_FILE%" >nul 2>&1

echo [DEV] Локальная разработка остановлена.

popd >nul
exit /b 0
