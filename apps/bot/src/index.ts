import 'dotenv/config';
import express from 'express';
import { Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { RU, createReplyKeyboard, createWebAppKeyboard, type WebAppUrls } from './menu';
import { createNotifyFamily, type NotifyFamily } from './notify';

const requireEnv = (key: keyof NodeJS.ProcessEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const BOT_TOKEN = requireEnv('BOT_TOKEN');
const webAppUrls: WebAppUrls = {
  shopping: requireEnv('WEBAPP_SHOPPING_URL'),
  calendar: requireEnv('WEBAPP_CALENDAR_URL'),
  budget: requireEnv('WEBAPP_BUDGET_URL')
};

const bot = new Telegraf<Context>(BOT_TOKEN);

const notifyFamily: NotifyFamily = createNotifyFamily(bot.telegram, process.env.FAMILY_CHAT_ID);

const replyKeyboard = createReplyKeyboard();
const webAppKeyboard = createWebAppKeyboard(webAppUrls);

bot.start(async (ctx) => {
  const intro = `${RU.greeting}\n${RU.description}\n\n${RU.replyPrompt}`;
  await ctx.reply(intro, replyKeyboard);
  await ctx.reply(RU.webAppPrompt, webAppKeyboard);
});

bot.hears(
  [RU.buttons.shopping, RU.buttons.calendar, RU.buttons.budget],
  async (ctx) => {
    await ctx.reply(RU.webAppPrompt, webAppKeyboard);
  }
);

const telegramExpressApp = express();
const webhookPath = '/telegram/webhook';

telegramExpressApp.use(express.json());
telegramExpressApp.post(webhookPath, (req, res) => {
  return bot.webhookCallback(webhookPath)(req, res);
});

telegramExpressApp.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: RU.botTitle,
    mode: process.env.NODE_ENV ?? 'development'
  });
});

if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT ?? 8080);
  telegramExpressApp.listen(port, () => {
    console.log(`${RU.botTitle} webhook listening on http://localhost:${port}${webhookPath}`);
    console.log('Для локальных тестов настройте туннель и установите вебхук вручную.');
  });
}

export { bot, telegramExpressApp, webhookPath, notifyFamily };
