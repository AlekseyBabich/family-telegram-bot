@echo off
title Deploy Functions (Telegram bot)
echo Building functions (TypeScript -> JS)...
npm run build:functions || goto :err
echo.
echo Deploying Firebase Functions...
npm run deploy:functions || goto :err
echo.
echo DONE: Functions deployed. Check Cloud Functions URLs in the console output.
pause
exit /b 0
:err
echo.
echo FAILED. Did you run `firebase login`, `firebase use family-bot-33940`,
echo and set secrets (BOT_TOKEN, BOT_USERNAME, FAMILY_CHAT_ID, NOTIFY_API_KEY)?
pause
exit /b 1
