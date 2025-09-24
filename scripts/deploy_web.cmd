@echo off
title Deploy Web (Firebase Hosting)
echo Building web...
npm run build:web || goto :err
echo.
echo Deploying web to Firebase Hosting...
npm run deploy:web || goto :err
echo.
echo DONE: Web deployed to Firebase Hosting.
echo.
echo Done. Press any key to close...
pause
exit /b 0
:err
echo.
echo FAILED. Make sure Node 18+ is installed, `firebase-tools` is installed (`npm i -g firebase-tools`),
echo and you are logged in (`firebase login`) and selected the project (`firebase use family-bot-33940`).
echo.
echo Done. Press any key to close...
pause
exit /b 1
