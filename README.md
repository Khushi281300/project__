# GCC Ledger

A source-backed record of who built which Global Capability Centre (GCC) in India, where, and with whose help.
Prototype for the Flexiple Product Intern assignment.

## Run it

Needs Node 22.13 or newer. No database to install.

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests for the verification rule
npm run build && npm start   # production
```

AI features are optional. Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to switch on
AI-written answers (Ask) and AI extraction (Submit evidence). Without a key, Ask still answers by matching
the question to filters (city, sector, provider, company, status) and citing the records, and Submit is filled by hand.

## Deploy (Vercel)

1. Push this folder to a GitHub repository.
2. In Vercel: Add New, Project, import the repository. Framework is detected as Next.js; keep the defaults.
3. In Settings, set Node.js Version to 22.x. Add `ANTHROPIC_API_KEY` under Environment Variables if you want the AI features.
4. Deploy and open the URL.

Any Node 22 host works the same way: `npm run build` then `npm start`.

## What is in it

| Page | What it does |
| --- | --- |
| `/` | Search and filter 50 GCC records. Every row shows its status and source count. |
| `/gcc/:slug` | One centre: facts, provider links, and the source behind each. |
| `/providers`, `/providers/:slug` | Each provider's links, split into verified and claimed. |
| `/market` | Published market figures, city benchmarks (rent, salary bands), and state GCC policy terms. |
| `/plan` | Interactive Setup Feasibility Copilot: model Year-1 budgets, compare city clusters, and synthesize an AI strategic blueprint with peer citations. |
| `/ask` | A plain-English question answered only from ledger records, with citations. Works without an AI key (rule-based); an AI key upgrades the wording. |
| `/submit` | Paste an article, AI fills the fields, a person reviews. Source link required. |
| `/method` | The verification rule, the build process, and the API reference. |

## The data

`data/raw/` holds the research as collected (October 2026). `scripts/build-seed.mjs` applies the curation
decisions (drops, caveats, which source backs which link) and writes `data/seed.json`. Run `npm run seed` after editing.
Source summaries are paraphrased. It is a sample of 50 centres, not a census. Market figures on `/market` live in `data/market.ts`, each with its source URL.

Architecture, database design and API details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
