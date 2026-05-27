# Batonyx MVP

Batonyx is a focused Sales-to-Customer Success handoff demo. It turns CRM deal context and call transcripts into a structured CSM handoff document with source evidence, missing-field visibility, notification state, and review feedback.

## What Works

- Handoff-first Next.js app
- Mock HubSpot CRM deal context
- Zoom/manual transcript source
- Manual transcript paste and `.txt` upload
- Groq-backed AI extraction through a server route
- LocalStorage persistence across refreshes
- CSM notification, rating, flags, comments, and reviewed state

## Local Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `GROQ_API_KEY` in `.env.local`.

Open `http://127.0.0.1:3000`.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import it in Vercel as a Next.js project.
3. Add an environment variable:
   - `GROQ_API_KEY`
4. Deploy.

The Groq key is only read in `app/api/extract/route.ts`, so it stays server-side and is not exposed to the browser.

## Demo Notes

This is now suitable for a chargeable workflow demo with real transcript text. CRM sync and notifications are still mocked; the extraction step is real AI as long as `GROQ_API_KEY` is configured.
