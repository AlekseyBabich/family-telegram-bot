# CI/CD with GitHub Actions (Firebase)

1. Create a service account for Firebase:
   - Firebase Console → Project settings → Service accounts → Generate new private key → download JSON.
2. Add GitHub secret:
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   - Name: FIREBASE_SERVICE_ACCOUNT
   - Value: paste entire JSON from step 1.
3. Set Firebase environment variables for Functions (in Firebase Console):
   Build → Functions → Variables (2nd gen):
   - BOT_TOKEN
   - BOT_USERNAME
   - FAMILY_CHAT_ID
   - WEBAPP_BASE_URL (e.g. https://family-bot-33940.web.app)
   - WEBAPP_SHOPPING_URL (…/#!/shopping or …/#/shopping)
   - WEBAPP_CALENDAR_URL
   - WEBAPP_BUDGET_URL
   - NOTIFY_API_KEY
4. Frontend notify config:
   - Create `apps/web/.env` locally (not committed):
     VITE_NOTIFY_ENDPOINT=https://<your-cloud-function-domain>/notify
     VITE_NOTIFY_API_KEY=<same as NOTIFY_API_KEY>
5. Deploy sequence:
   - Push to `main` → `firebase-hosting.yml` builds and deploys web to Hosting.
   - Push to `main` → `firebase-functions.yml` builds and deploys Functions.
6. Set Telegram webhook (BotFather):
   /setwebhook → https://<your-cloud-function-domain>/telegramBot

## Workspace installs

The root `postinstall` script was removed because it triggered an infinite loop in CI. Workspaces are still installed by running `npm install` locally or in GitHub Actions, where installs use `--ignore-scripts` to avoid reintroducing the loop.
