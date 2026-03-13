# Cityzeen TDD

Starter cleanup completed. Default Next.js and Amplify Todo template artifacts were removed from the app shell, styling, public assets, and data schema.

## Local development

Start the Next.js app on HTTP:

```bash
npm run dev
```

## Local HTTPS for Powens

Powens redirects back to the app over HTTPS. For local testing, run the app on port `3000` and terminate HTTPS on port `3001` with the local certificate files already checked into this repo.

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. In another terminal, start the HTTPS proxy:

```bash
npm run dev:https
```

4. Set the callback base URL in `.env.local`:

```env
APP_URL=https://localhost:3001
```

5. Open the app at [https://localhost:3001](https://localhost:3001) and accept the local certificate warning if your browser shows one.

Powens should then redirect back to:

```text
https://localhost:3001/powens/callback
```
