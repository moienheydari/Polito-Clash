# StudyDuel AI

StudyDuel AI is a two-student, realtime competition prototype built with Next.js, Supabase, OpenAI, and `unpdf`.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) and `OPENAI_API_KEY`.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. In Supabase Auth settings, disable **Confirm email** for a classroom demo, or keep it enabled and use the confirmation link before logging in.
4. Install and start:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in two browsers and register two users. The host uploads one text-based PDF, shares the six-character room code, and starts once the second student joins.

## Deployment

Import the repository into Vercel, add all variables from `.env.example` as Production/Preview environment variables, and deploy. The `documents` Storage bucket must remain private. The Supabase URL and publishable key may be public; secret/service-role and OpenAI keys must never be exposed to the browser.

## Known prototype limits

Only text-based PDFs up to 4 MB are supported. OCR, email reset, and a dedicated worker are intentionally omitted. Progress is driven by participant polling with Supabase table changes available for future UI subscriptions; the database remains authoritative.
