# Batonyx MVP

Batonyx is an AI-powered Sales-to-Customer Success handoff assistant for B2B SaaS teams.

It turns CRM deal context and sales call transcripts into a structured handoff document so CSMs can start onboarding with the customer goals, pain points, stakeholders, risks, promises, and next steps already captured.

## Problem

Sales usually has the full customer story, but that context gets scattered across CRM notes, call transcripts, emails, and Slack. Customer Success then starts onboarding with missing information and often has to ask the customer to repeat what was already discussed during sales.

Batonyx solves the context gap between closed-won and onboarding kickoff.

## Current Demo

The current MVP supports:

- Handoff-first Next.js interface
- Manual transcript paste
- `.txt`, `.md`, and `.vtt` transcript upload
- Transcript-derived customer/deal context
- Editable account, deal, AE owner, and CSM fields
- Groq-backed AI extraction
- Structured handoff sections:
  - Account overview
  - Buying story
  - Pain points
  - Goals and success criteria
  - Stakeholder map
  - Risks and objections
  - Promises and commitments
  - Next steps
- Source evidence snippets from transcript or CRM notes
- Missing-field highlighting
- CSM notification state
- CSM rating, flags, comments, and reviewed status
- Browser `localStorage` persistence across refreshes

## What Is Real vs Mocked

Real:

- AI extraction using Groq through a server-side API route
- Transcript upload and paste workflow
- Structured handoff generation
- Editable handoff content
- CSM review flow
- Local browser persistence

Mocked:

- HubSpot/Salesforce sync
- Gong/Zoom native sync
- Slack/email notification delivery
- Authentication, workspaces, and roles
- Database persistence

## Tech Stack

- Next.js
- TypeScript
- React
- Groq OpenAI-compatible Chat Completions API
- LocalStorage for demo persistence

## Local Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set this variable in `.env.local`:

```bash
GROQ_API_KEY=your_groq_key_here
```

Open:

```bash
http://127.0.0.1:3000
```

## Vercel Deployment

1. Import this GitHub repo into Vercel.
2. Add the environment variable:

```bash
GROQ_API_KEY=your_groq_key_here
```

3. Redeploy after adding the key.

The Groq key is only read by `app/api/extract/route.ts`, so it stays server-side and is not exposed to the browser.

## Demo Flow

1. Upload or paste a real sales transcript.
2. Confirm the detected account/deal details in the CRM context panel.
3. Click **Generate handoff**.
4. Review extracted sections and source evidence.
5. Send the handoff alert.
6. Add CSM rating, flags, and review comments.
7. Refresh the page to confirm the handoff persists.

## Next Production Steps

- Add real auth and workspace isolation.
- Add PostgreSQL persistence.
- Add real HubSpot or Salesforce connector.
- Add real Gong or Zoom transcript sync.
- Add Slack/email notification delivery.
- Add audit trail for generated handoffs and edits.
- Add admin data deletion controls.
