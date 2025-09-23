declare namespace NodeJS {
  interface ProcessEnv {
    BOT_TOKEN?: string;
    BOT_USERNAME?: string;
    FAMILY_CHAT_ID?: string;
    WEBAPP_BASE_URL?: string;
    WEBAPP_SHOPPING_URL?: string;
    WEBAPP_CALENDAR_URL?: string;
    WEBAPP_BUDGET_URL?: string;
    NOTIFY_API_KEY?: string;
    PORT?: string;
    NODE_ENV?: string;
  }
}
