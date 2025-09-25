# Ручной деплой (Windows 11)

Подробное руководство по развёртыванию семейного Telegram-бота и WebApp в бесплатном тарифе Firebase.

## 1. Требования
- Windows 11 с правами администратора.
- Установленный [Node.js 18 LTS](https://nodejs.org/en/download/).
- Доступ к проекту Firebase `family-bot-33940` (роль Editor или выше).
- Возможность авторизоваться в Firebase CLI (Google-аккаунт с правами на проект).

## 2. Установка инструментов
1. Откройте PowerShell от имени обычного пользователя.
2. Установите Firebase CLI:
   ```powershell
   npm install -g firebase-tools
   ```
3. Проверьте версию, чтобы убедиться, что установка прошла успешно:
   ```powershell
   firebase --version
   ```

## 3. Клонирование и установка зависимостей
1. Склонируйте репозиторий или скачайте архив.
2. В корне проекта выполните установку всех workspace-зависимостей:
   ```powershell
   npm -ws install
   ```
3. Убедитесь, что команды `npm --workspace apps/web run build` и `npm --workspace firebase run build` выполняются без ошибок (это можно проверить на шаге 6).

## 4. Авторизация и выбор проекта
1. Авторизуйтесь в Firebase CLI (откроется браузер):
   ```powershell
   firebase login
   ```
2. Выберите проект по умолчанию:
   ```powershell
   firebase use family-bot-33940
   ```
   После выполнения команда `firebase projects:list` должна показывать `family-bot-33940` с пометкой `(current)`.

## 5. Настройка секретов Firebase Functions
Секреты хранятся в Firebase и подтягиваются при развёртывании. Для каждого ключа выполните команду:
```powershell
firebase functions:secrets:set <ИМЯ>
```
Используйте следующие имена и значения:
- `BOT_TOKEN` — токен вашего Telegram-бота.
- `BOT_USERNAME` — @username бота (без `@`).
- `FAMILY_CHAT_ID` — идентификатор семейного чата.
- `NOTIFY_API_KEY` — ключ, который используется веб-приложением для вызова функции уведомлений.
- `WEBAPP_URL` — полный URL WebApp (используется для кнопок в интерфейсе Telegram).

> Совет: Можно передать значение напрямую: `firebase functions:secrets:set BOT_TOKEN --data "123:ABC"`.

## 6. Деплой
В папке `scripts/` находятся готовые сценарии для Windows.

### 6.1. Веб-приложение
1. Дважды кликните `scripts/deploy_web.cmd` или запустите файл через контекстное меню «Запустить».
2. В окне консоли автоматически выполнятся команды:
   ```powershell
   npm run build:web
   npm run deploy:web
   ```
3. После успешного завершения скрипт покажет сообщение `DONE` и предложит нажать клавишу для выхода.

### 6.2. Firebase Functions
1. Запустите `scripts/deploy_functions.cmd`.
2. Скрипт выполнит сборку TypeScript → JavaScript и развернёт функции:
   ```powershell
   npm run build:functions
   npm run deploy:functions
   ```
3. В консоли Firebase CLI будут показаны URLs развёрнутых функций. Сохраните URL `telegramBot` для настройки вебхука.

### 6.3. Полный деплой через npm
При необходимости можно выполнить полный деплой одной командой без скриптов:
```powershell
npm run deploy:all
```
Команда соберёт веб и функции, затем запустит `firebase deploy`.

## 7. Настройка вебхука Telegram
1. Откройте BotFather и выполните `/setwebhook` → вставьте URL `https://<region>-family-bot-33940.cloudfunctions.net/telegramBot`.
2. Либо вызовите API напрямую:
   ```
   https://api.telegram.org/bot<ВАШ_BOT_TOKEN>/setWebhook?url=https://<region>-family-bot-33940.cloudfunctions.net/telegramBot
   ```
3. Убедитесь, что регион совпадает с регионом ваших Cloud Functions (например, `europe-west1`).

## 8. Чек-лист перед деплоем
- [ ] Node.js 18 установлен и доступен в `PATH`.
- [ ] `firebase-tools` установлены (`firebase --version`).
- [ ] Выбрано окружение `family-bot-33940` (`firebase use family-bot-33940`).
- [ ] Все четыре секрета заданы в Firebase Functions.
- [ ] Команда `npm run build:functions` завершилась успешно.
- [ ] Веб-приложение собирается (`npm run build:web`).

## 9. Частые ошибки и решения
- **`firebase` не распознаётся** — перезапустите PowerShell после установки или переустановите Node.js.
- **Нет доступа к проекту** — проверьте, что используемый Google-аккаунт добавлен в Firebase Console.
- **Секрет не найден во время деплоя** — перепроверьте команду `firebase functions:secrets:set` и убедитесь, что имя совпадает.
- **Ошибка сборки функций** — выполните `npm --workspace firebase install`, затем `npm --workspace firebase run build`.

## 10. Возврат к CI/CD
Если понадобится автоматизировать процесс, включите биллинг в Firebase и восстановите папку `.github/workflows` с нужными GitHub Actions. После добавления сервисного аккаунта и секретов пайплайны снова смогут деплоить проект автоматически.
