import 'dotenv/config';
import express from 'express';
import { Markup, Telegraf } from 'telegraf';
import type { Context } from 'telegraf';
import { RU, createWebAppKeyboard } from './menu';
import { createNotifyFamily, type NotifyFamily } from './notify';

const requireEnv = (key: keyof NodeJS.ProcessEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const BOT_TOKEN = requireEnv('BOT_TOKEN');
const webAppUrl = requireEnv('WEBAPP_URL');

const bot = new Telegraf<Context>(BOT_TOKEN);

const notifyFamily: NotifyFamily = createNotifyFamily(bot.telegram, process.env.FAMILY_CHAT_ID);

const webAppKeyboard = createWebAppKeyboard(webAppUrl);

const legacyButtonTexts = [...RU.legacyButtons];

const hideLegacyReplyKeyboard = async (ctx: Context) => {
  if (!ctx.chat) {
    return;
  }

  try {
    const cleanupMessage = await ctx.reply('\u200B', Markup.removeKeyboard());
    await ctx.telegram.deleteMessage(ctx.chat.id, cleanupMessage.message_id);
  } catch (error) {
    console.error('KeyboardCleanupError', error);
  }
};

void bot.telegram
  .setChatMenuButton({
    menuButton: {
      type: 'web_app',
      text: RU.buttonLabel,
      web_app: {
        url: webAppUrl
      }
    }
  })
  .catch((error) => {
    console.error('MenuButtonError', error);
  });

bot.start(async (ctx) => {
  await hideLegacyReplyKeyboard(ctx);
  await ctx.reply(RU.greeting, webAppKeyboard);
});

bot.hears(legacyButtonTexts, async (ctx) => {
  await hideLegacyReplyKeyboard(ctx);
  await ctx.reply(RU.greeting, webAppKeyboard);
});

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
