# Family Telegram Bot

## Назначение проекта
Бот Telegram с WebApp-приложением для семьи: списки покупок, календарь событий и учёт бюджета. Веб-интерфейс разворачивается на Firebase Hosting, а функции бота работают через Firebase Functions.

## Стек
- [Telegraf](https://telegraf.js.org/) для логики Telegram-бота.
- [Firebase Functions](https://firebase.google.com/docs/functions) для серверной части.
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) для WebApp.
- [Cloud Firestore](https://firebase.google.com/docs/firestore) как база данных.

## Быстрый старт (Windows 11)
1. Установите инструменты Firebase CLI:
   ```powershell
   npm install -g firebase-tools
   ```
2. Авторизуйтесь и выберите проект:
   ```powershell
   firebase login
   firebase use family-bot-33940
   ```
3. Установите зависимости монорепозитория:
   ```powershell
   npm -ws install
   ```
4. Задайте секреты для функций (хранятся в Firebase, а не в `.env`):
   ```powershell
   firebase functions:secrets:set BOT_TOKEN
   firebase functions:secrets:set BOT_USERNAME
   firebase functions:secrets:set FAMILY_CHAT_ID
   firebase functions:secrets:set NOTIFY_API_KEY
   ```
   Поддерживается интерактивный ввод или передача значений через `--data`.

## Деплой
- **Веб-приложение:** дважды кликните `scripts/deploy_web.cmd` или выполните вручную
  ```powershell
  npm run build:web
  npm run deploy:web
  ```
- **Функции:** запустите `scripts/deploy_functions.cmd` или выполните вручную
  ```powershell
  npm run build:functions
  npm run deploy:functions
  ```
- **Обе части сразу:**
  ```powershell
  npm run deploy:all
  ```

## Установка вебхука Telegram
Настройте вебхук через BotFather (`/setwebhook`) или напрямую запросом вида:
```
https://api.telegram.org/bot<ВАШ_BOT_TOKEN>/setWebhook?url=https://<firebase-region>-<project>.cloudfunctions.net/telegramBot
```
Замените `<firebase-region>` на регион развёртывания функций и `<project>` на идентификатор проекта (например, `family-bot-33940`).

## Частые проблемы
- Не установлены `firebase-tools`: проверьте доступность команды `firebase --version`.
- Проект Firebase не выбран: выполните `firebase use family-bot-33940`.
- Секреты не заданы: убедитесь, что все четыре секрета существуют в Firebase Functions.
- Не установлен Node.js 18+: обновите Node до LTS.

## Как вернуться к CI/CD
Для возврата к автоматическим деплоям необходимо снова включить биллинг в Firebase и восстановить GitHub Actions workflows (`.github/workflows`). После этого можно настроить токены и секреты для сервис-аккаунта, чтобы автоматические пайплайны снова запускались при пушах в основную ветку.
