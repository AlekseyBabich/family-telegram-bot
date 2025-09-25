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

## Локальная разработка с туннелем
Для локальной отладки можно пробрасывать публичный HTTPS-туннель на Express-сервер бота. Продакшн-вебхук остаётся настроенным на Firebase Functions (см. раздел выше).

1. Скопируйте `.env.example` в `.env.local` в корне репозитория и заполните хотя бы `BOT_TOKEN` (остальные переменные также можно указать для корректной работы бота).
2. Установите любой поддерживаемый туннель: [ngrok](https://ngrok.com/download) (предпочтительно) или [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
3. Запустите скрипт `scripts/dev_local_start.cmd`. Он поднимет `npm --workspace apps/bot run start`, найдёт доступный туннель и автоматически вызовет `setWebhook` на адрес вида `<туннель>/telegram/webhook`.
4. Скрипт напечатает текущий URL из `getWebhookInfo` для проверки. Адрес туннеля меняется при каждом запуске, поэтому вебхук обновляется автоматически.
5. После завершения работы выполните `scripts/dev_local_stop.cmd`. Он очистит вебхук и остановит процессы туннеля и локального бота.

> ⚠️ Если ни один туннель не найден, скрипт подскажет, как установить ngrok или cloudflared.

## Частые проблемы
- Не установлены `firebase-tools`: проверьте доступность команды `firebase --version`.
- Проект Firebase не выбран: выполните `firebase use family-bot-33940`.
- Секреты не заданы: убедитесь, что все четыре секрета существуют в Firebase Functions.
- Не установлен Node.js 18+: обновите Node до LTS.

## Настройка WebApp URL и проверка интерфейса бота
- Добавлен единый WebApp-интерфейс. Задайте переменную `WEBAPP_URL` cо ссылкой на продакшен- или локальный WebApp:
  - Локально — через файл `.env` в корне монорепозитория.
  - В облаке — командой `firebase functions:secrets:set WEBAPP_URL --data "https://example.com"`.
- После деплоя проверьте работу бота:
  1. Отправьте `/start` в Telegram — бот должен ответить одной фразой «Hello! Open the app:» и кнопкой «Open the app».
  2. Убедитесь, что под полем ввода не осталось старых Reply-клавиатур.
  3. Откройте меню (≡) в чате — там должна появиться кнопка WebApp с тем же URL.

### Обновлённые файлы
- `apps/bot/src/index.ts`
- `apps/bot/src/menu.ts`
- `apps/bot/src/types.d.ts`
- `firebase/functions.ts`
- `.env.example`

## Как вернуться к CI/CD
Для возврата к автоматическим деплоям необходимо снова включить биллинг в Firebase и восстановить GitHub Actions workflows (`.github/workflows`). После этого можно настроить токены и секреты для сервис-аккаунта, чтобы автоматические пайплайны снова запускались при пушах в основную ветку.
