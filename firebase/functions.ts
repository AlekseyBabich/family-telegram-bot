// firebase/functions.ts
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Telegraf, Markup } from "telegraf";
import type { Update } from "telegraf/types";

const {
  BOT_TOKEN,
  BOT_USERNAME, // можно хранить для информации, но в конструктор не передаём
  FAMILY_CHAT_ID,
  WEBAPP_BASE_URL,
  WEBAPP_SHOPPING_URL,
  WEBAPP_CALENDAR_URL,
  WEBAPP_BUDGET_URL,
  NOTIFY_API_KEY,
} = process.env;

// Создаём бота ТОЛЬКО если есть токен, без лишних опций (username сюда не передают)
const bot = BOT_TOKEN ? new Telegraf<Update>(BOT_TOKEN) : (null as unknown as Telegraf<Update>);

// Кнопки веб-аппов
const menu = () =>
  Markup.inlineKeyboard([
    [Markup.button.webApp("🛒 Покупки", WEBAPP_SHOPPING_URL || `${WEBAPP_BASE_URL}/#/shopping`)],
    [Markup.button.webApp("📅 Календарь", WEBAPP_CALENDAR_URL || `${WEBAPP_BASE_URL}/#/calendar`)],
    [Markup.button.webApp("💰 Бюджет", WEBAPP_BUDGET_URL || `${WEBAPP_BASE_URL}/#/budget`)],
  ]);

// Хэндлеры
if (BOT_TOKEN) {
  bot.start(async (ctx) => ctx.reply("Семейный бот — выберите раздел:", menu()));
  bot.hears(/меню|menu|главное/i, async (ctx) => ctx.reply("Меню:", menu()));
}

// HTTPS-вебхук Telegram
export const telegramBot = onRequest({ cors: true }, async (req, res) => {
  if (!BOT_TOKEN) return res.status(500).send("Bot is not configured");
  const callback = bot.webhookCallback("/");
  return callback(req as any, res as any);
});

// Простой эндпоинт уведомлений из фронта
export const notify = onRequest({ cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    if (!BOT_TOKEN || !FAMILY_CHAT_ID) return res.status(500).send("Server not configured");

    const apiKey = req.header("x-api-key") || req.header("X-API-KEY");
    if (!apiKey || apiKey !== NOTIFY_API_KEY) return res.status(401).send("Unauthorized");

    const { text } = (req.body || {}) as { text?: string };
    const msg = (text || "").trim();
    if (!msg) return res.status(400).send("Text is required");

    await bot.telegram.sendMessage(FAMILY_CHAT_ID, msg);
    res.status(200).send({ ok: true });
  } catch (e) {
    logger.error("notify error", e);
    res.status(500).send("Internal error");
  }
});
