# Firebase инфраструктура

## Что входит

- `functions.ts` — экспорт HTTP функций `telegramBot` и `notify`.
- `firestore.rules` — базовые правила безопасности Firestore.

## Шаги настройки

1. Создайте проект в Firebase Console и включите Firestore, Hosting и Cloud Functions.
2. Сконфигурируйте Telegram бота (получите `BOT_TOKEN`) и пропишите вебхук на HTTPS-адрес функции `telegramBot` после деплоя.
3. В Firebase Hosting добавьте rewrite `/notify` на функцию `notify`, чтобы WebApp мог вызывать её по относительному пути.
4. Заполните переменные окружения из файла `.env.example` и добавьте их в `firebase functions:config:set` либо используйте `.env` при локальной разработке.
5. Перед продакшеном обновите правила Firestore, чтобы ограничить доступ конкретной семьёй (например, по allowlist Telegram ID).

## Полезные команды

```bash
# Локальный запуск функций
firebase emulators:start --only functions,firestore,hosting

# Деплой правил
firebase deploy --only firestore:rules
```

> ⚠️ Firebase CLI и Node 18+ требуются для деплоя Cloud Functions v2.
