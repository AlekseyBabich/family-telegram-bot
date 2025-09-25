import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Telegraf, Markup } from "telegraf";
import type { Context } from "telegraf";

const {
  BOT_TOKEN,
  BOT_USERNAME,
  FAMILY_CHAT_ID,
  WEBAPP_URL,
  NOTIFY_API_KEY,
} = process.env;

const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

const webAppUrl = WEBAPP_URL;

const startKeyboard = webAppUrl
  ? Markup.inlineKeyboard([[Markup.button.webApp("Open the app", webAppUrl)]])
  : null;

const hideLegacyReplyKeyboard = async (ctx: Context) => {
  if (!ctx.chat) {
    return;
  }

  try {
    const cleanupMessage = await ctx.reply("\u200B", Markup.removeKeyboard());
    await ctx.telegram.deleteMessage(ctx.chat.id, cleanupMessage.message_id);
  } catch (error) {
    logger.error("KeyboardCleanupError", error);
  }
};

const sendWebAppEntry = async (ctx: Context) => {
  if (!startKeyboard || !webAppUrl) {
    await ctx.reply("WebApp URL is not configured.");
    return;
  }

  await hideLegacyReplyKeyboard(ctx);
  await ctx.reply("Hello! Open the app:", startKeyboard);
};

if (bot) {
  if (webAppUrl) {
    void bot.telegram
      .setChatMenuButton({
        menuButton: {
          type: "web_app",
          text: "Open the app",
          web_app: {
            url: webAppUrl,
          },
        },
      })
      .catch((error) => {
        logger.error("MenuButtonError", error);
      });
  }

  bot.start(sendWebAppEntry);
  bot.hears(/меню|menu|главное/i, sendWebAppEntry);
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
