import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Telegraf, Markup } from "telegraf";

const {
  BOT_TOKEN,
  BOT_USERNAME,
  FAMILY_CHAT_ID,
  WEBAPP_BASE_URL,
  WEBAPP_SHOPPING_URL,
  WEBAPP_CALENDAR_URL,
  WEBAPP_BUDGET_URL,
  NOTIFY_API_KEY,
} = process.env;

const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

const menu = () =>
  Markup.inlineKeyboard([
    [Markup.button.webApp("🛒 Покупки", WEBAPP_SHOPPING_URL || `${WEBAPP_BASE_URL}/#/shopping`)],
    [Markup.button.webApp("📅 Календарь", WEBAPP_CALENDAR_URL || `${WEBAPP_BASE_URL}/#/calendar`)],
    [Markup.button.webApp("💰 Бюджет", WEBAPP_BUDGET_URL || `${WEBAPP_BASE_URL}/#/budget`)],
  ]);

if (bot) {
  bot.start(async (ctx) => ctx.reply("Семейный бот — выберите раздел:", menu()));
  bot.hears(/меню|menu|главное/i, async (ctx) => ctx.reply("Меню:", menu()));
}

export const telegramBot = onRequest({ cors: true }, async (req, res) => {
  if (!bot) {
    res.status(500).send("Bot is not configured");
    return;
  }
  const callback = bot.webhookCallback("/");
  await callback(req as any, res as any);
});

export const notify = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    if (!bot || !FAMILY_CHAT_ID) {
      res.status(500).send("Server not configured");
      return;
    }

    const apiKey = req.header("x-api-key") || req.header("X-API-KEY");
    if (!apiKey || apiKey !== NOTIFY_API_KEY) {
      res.status(401).send("Unauthorized");
      return;
    }

    const { text } = (req.body || {}) as { text?: string };
    const msg = (text || "").trim();
    if (!msg) {
      res.status(400).send("Text is required");
      return;
    }

    await bot.telegram.sendMessage(FAMILY_CHAT_ID, msg);
    res.status(200).send({ ok: true });
    return;
  } catch (e) {
    logger.error("notify error", e);
    res.status(500).send("Internal error");
    return;
  }
});
