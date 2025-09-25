declare namespace NodeJS {
  interface ProcessEnv {
    BOT_TOKEN?: string;
    BOT_USERNAME?: string;
    FAMILY_CHAT_ID?: string;
    WEBAPP_URL?: string;
    NOTIFY_API_KEY?: string;
    PORT?: string;
    NODE_ENV?: string;
  }
}
