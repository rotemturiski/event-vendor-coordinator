# VendorFlow — Event Vendor Coordinator 🎯

Frontend for the "Ship It" hackathon (Teams 5 & 6). A tool for people planning
small events (weddings, bar mitzvahs, corporate dinners) to manage vendor
communications, track deliverables & deadlines, and generate AI follow-up drafts.

## ✅ Brief requirements covered (frontend)

- **Real calendar dates** — every deadline is derived from the event date.
- **Auto-adjusting timeline** — change the event date in the header and the
  whole timeline + every countdown recomputes live (deadlines are stored as
  `daysBefore`, dates are derived).
- **Structured vendor import** — manual entry with structured fields **and**
  CSV upload (Hebrew/English headers, downloadable template).
- **Data-driven AI drafts** — every draft references the specific vendor name,
  contact, deliverable, and computed deadline (not a generic template).
- **Improves with usage** — 👍/👎 feedback accumulates into a learned tone
  preference, persisted locally. The `generateDraft()` seam is a drop-in for a
  real `/api/draft` LLM call (same signature, async-ready).
- **Notification architecture** — WhatsApp (`wa.me`) and Email (`mailto:`)
  delivery wired in the UI; the production path (queue → provider) is documented.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel   # once
vercel            # follow prompts → live URL
```

Vercel auto-detects Vite (build: `npm run build`, output: `dist`). No config needed.

## Stack

React 18 · Vite 6 · Tailwind CSS v4 · RTL Hebrew · zero backend (frontend phase)
