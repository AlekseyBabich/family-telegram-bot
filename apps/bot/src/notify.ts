import type { Telegram } from 'telegraf';

export type NotifyFamily = (text: string) => Promise<void>;

export const createNotifyFamily = (
  telegram: Telegram,
  chatId?: string
): NotifyFamily => {
  if (!chatId) {
    console.warn('FAMILY_CHAT_ID is not configured. notifyFamily will be a no-op.');
    return async () => {
      /* noop */
    };
  }

  return async (text: string) => {
    if (!text.trim()) {
      return;
    }

    await telegram.sendMessage(chatId, text, {
      disable_notification: false
    });
  };
};
