import * as functions from 'firebase-functions';
import type { Request, Response } from 'express';
import { telegramExpressApp, notifyFamily } from '../apps/bot/src/index.js';

const allowedOrigin = process.env.WEBAPP_BASE_URL;
const notifyApiKey = process.env.NOTIFY_API_KEY;

const handleCors = (req: Request, res: Response) => {
  if (allowedOrigin && req.headers.origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-KEY');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }

  return false;
};

export const telegramBot = functions.https.onRequest(telegramExpressApp);

export const notify = functions.https.onRequest(async (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!notifyApiKey || req.headers['x-api-key'] !== notifyApiKey) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  const { text } = req.body ?? {};

  if (typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ ok: false, error: 'Текст уведомления обязателен' });
    return;
  }

  try {
    await notifyFamily(text);
    res.json({ ok: true });
  } catch (error) {
    console.error('Failed to notify family', error);
    res.status(500).json({ ok: false, error: 'Ошибка при отправке уведомления' });
  }
});
