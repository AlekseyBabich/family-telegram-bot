import { Markup } from 'telegraf';

export const RU = {
  botTitle: 'Семейный бот',
  greeting: 'Привет! 👋',
  description: 'Семейный бот: Покупки, Календарь, Бюджет.',
  replyPrompt: 'Выберите раздел ниже.',
  webAppPrompt: 'Откройте нужный раздел внутри Telegram:',
  notifyFallback: 'Не удалось отправить уведомление семье.',
  buttons: {
    shopping: '🛒 Покупки',
    calendar: '📅 Календарь',
    budget: '💰 Бюджет'
  }
} as const;

export interface WebAppUrls {
  shopping: string;
  calendar: string;
  budget: string;
}

export const createReplyKeyboard = () =>
  Markup.keyboard([
    [RU.buttons.shopping],
    [RU.buttons.calendar],
    [RU.buttons.budget]
  ]).resize();

export const createWebAppKeyboard = (urls: WebAppUrls) =>
  Markup.inlineKeyboard(
    [
      [Markup.button.webApp(RU.buttons.shopping, urls.shopping)],
      [Markup.button.webApp(RU.buttons.calendar, urls.calendar)],
      [Markup.button.webApp(RU.buttons.budget, urls.budget)]
    ]
  );
