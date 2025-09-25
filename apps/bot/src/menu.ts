import { Markup } from 'telegraf';

export const RU = {
  botTitle: 'Семейный бот',
  greeting: 'Hello! Open the app:',
  notifyFallback: 'Не удалось отправить уведомление семье.',
  buttonLabel: 'Open the app',
  legacyButtons: ['🛒 Покупки', '📅 Календарь', '💰 Бюджет']
} as const;

export const createWebAppKeyboard = (url: string) =>
  Markup.inlineKeyboard([[Markup.button.webApp(RU.buttonLabel, url)]]);
