# GCC Ledger: architecture

## 1. Decision: a modular monolith

One Next.js application holds the UI, the REST API and the data layer. It builds and deploys as one unit.

Why this and not microservices:

- One developer, one deadline, about 50 records. Separate services would add network hops, deployment steps and failure modes with nothing to gain.
- The server-rendered pages call the data layer as a function call, in process. There is no HTTP round trip between "frontend" and "backend".
- The code is still split by responsibility (section 3), so a part can be lifted out later without a rewrite.

What would be split out first, and when:

| Part | Split when | Becomes |
| --- | --- | --- |
| Ingestion (collect, extract) | Sources are crawled on a schedule | A worker fed by a job queue |
| Search | Records pass roughly 100,000 or need typo tolerance | A search service (Postgres FTS first, then a dedicated engine) |
| AI calls | Volume or cost needs batching and caching | A small gateway with a response cache |

## 2. High-level design

```
 Browser
    |  HTML (server-rendered)            JSON
    v                                     v
+-----------------------------------------------------------+
|  Next.js app (one deployable)                             |
|                                                           |
|  Pages (app/*)            REST API (app/api/v1/*)         |
|      \                        /                           |
|       v                      v                            |
|   Services (lib/services)  ask, extract                   |
|       |            \                                      |
|       v             v                                     |
|   Repositories     LLM client (lib/llm) ----> Anthropic   |
|   (lib/repo, SQL)                             Messages API|
|       |                                                   |
|       v                                                   |
|   Domain rule (lib/domain/verification)                   |
|       |                                                   |
|       v                                                   |
|   Database (lib/db): SQLite in memory, built from         |
|   data/seed.json on cold start                            |
+-----------------------------------------------------------+
```

Request paths:

- **Read a page.** Record and provider pages are generated at build time (static). The home page renders on the server per request because it depends on the filters in the URL.
- **Search.** Filters become indexed `WHERE` clauses; free text goes through the full-text index. One query for the page of rows, one for the total.
- **Ask.** A pure planner (`lib/domain/plan.ts`) reads the question for a city, sector, provider, company, status or "outside the big metros", and the repository filters the records with the same `WHERE` builder the search page uses. If nothing is recognised it falls back to full-text retrieval (BM25). With an AI key, the chosen rows plus a provider scoreboard go to the model with strict rules: use only these records, cite each one, never upgrade "claimed" to "verified". Cited ids are checked against the chosen set before they are shown as links. With no key, or if the AI call fails, the planner writes the answer itself from the same rows (`mode: "rules"`), so the feature never degrades to a bare list.
- **Submit.** The model proposes fields from pasted text; a person edits them; the server validates and stores the submission as pending. Nothing is published automatically.

## 3. Low-level design

| Layer | Folder | Rule |
| --- | --- | --- |
| Pages and client components | `app/`, `components/` | Rendering only. No SQL. |
| API routes | `app/api/v1/` | Parse and validate input, call a repository or service, return the envelope. |
| Services | `lib/services/` | Multi-step use cases (`ask`, `extract`). |
| Repositories | `lib/repo/` | The only place SQL lives. Return typed objects from `lib/types.ts`. |
| Domain | `lib/domain/verification.ts`, `lib/domain/plan.ts` | The status rule and the question planner. Pure functions, no imports, unit tested. |
| Infrastructure | `lib/db/`, `lib/llm/`, `lib/http.ts` | Connection, schema, seeding, AI client, response helpers, rate limiter. |

Points worth noting:

- **Status is computed, never typed in.** `assess()` reads a record's sources and returns `verified` or `claimed` with a reason. The seed loader calls it for every centre and every provider link. The result is stored on the row so list filters use an index.
- **No N+1 queries.** A record page runs four statements whatever the number of links: the row, its sources, its links, and all link sources in one `IN (subquery)`.
- **Prepared statements are cached** per connection (`lib/repo/sql.ts`). The dynamic search query is assembled from fixed fragments; every value is a bound parameter.
- **Search input is sanitised** into quoted prefix terms before it reaches FTS5, so user text can never be parsed as query syntax.
- **AI safety.** The API key stays on the server. Pasted text and records are passed as data with an instruction to ignore embedded instructions. AI and write endpoints have a per-IP rate limit. AI output is parsed defensively and length-capped.

## 4. Database design

```
company 1---* gcc *---1 city
               |
               1
               |
               *
          engagement *---1 provider

source 1---* evidence ---> (gcc | engagement)      submission (review queue)

gcc_fts (FTS5 index, rowid = gcc.id)
```

| Table | Purpose | Key columns |
| --- | --- | --- |
| `company` | The parent multinational | `name` unique, `hq_country`, `sector` |
| `city` | Location | `name` unique, `state` |
| `gcc` | One centre of one company in one city | `slug` unique, `status`, `opened`, `verification`, `reason`, `source_count`; unique `(company_id, city_id)` |
| `provider` | A firm that helps set up, run, staff or house centres | `slug` unique, `type` |
| `engagement` | A provider's role in one centre | `role`, `verification`, `reason`; unique `(gcc_id, provider_id, role)` |
| `source` | One web page, stored once | `url` unique, `publisher`, `published`, `origin` |
| `evidence` | Links a source to the centre or the link it supports | `subject_type`, `subject_id`, `source_id`, `supports`; unique on all three ids |
| `submission` | Proposed records waiting for review | `source_url` required, `status` |

Indexes: `gcc(city_id)`, `gcc(verification)`, `engagement(gcc_id)`, `engagement(provider_id)`, `evidence(subject_type, subject_id)`, plus the unique keys above.

Design choices:

- **Evidence is its own table.** One article often supports both "this centre exists" and "this provider built it". Storing the source once and linking it twice keeps counts honest.
- **`origin` on the source** (independent, government, company, provider) is what lets the rule tell a press report from a provider's own marketing.
- **`verification` is denormalised on purpose.** It is derived data, recomputed whenever evidence changes, kept on the row for fast filtering.

### Why SQLite in memory, and the path to Postgres

The prototype must run anywhere with no setup and no account, including serverless hosts with a read-only disk. Node's built-in SQLite, loaded from a seed file at cold start (a few milliseconds for this size), gives real SQL, constraints and full-text search with zero dependencies.

The known limit: submissions live in one server instance's memory and are lost on restart. That is acceptable for a demo and is stated on the page.

For production the schema moves to Postgres table for table. Changes: `INTEGER PRIMARY KEY` to identity columns, `gcc_fts` to a `tsvector` column with a GIN index, the `evidence` subject pair to two nullable foreign keys with a check constraint, and a trigger or job to recompute `verification` when evidence changes. Only `lib/db/` and the SQL strings in `lib/repo/` change.

## 5. API

Base path `/api/v1`. JSON. Success: `{ "data": ..., "meta"?: ... }`. Failure: `{ "error": { "code", "message" } }` with a matching HTTP status.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/gccs` | `q`, `city`, `sector`, `provider` (slug), `verification`, `status`, `page`, `pageSize` (1 to 100). `meta` carries `total`, `page`, `pageSize`, `pages`. |
| GET | `/gccs/:slug` | Centre, sources, provider links with their sources. 404 if unknown. |
| GET | `/providers` | Providers with verified and claimed counts. |
| GET | `/providers/:slug` | One provider's links with sources. 404 if unknown. |
| GET | `/stats` | Headline counts and filter options. |
| POST | `/ask` | `{ question }` 3 to 300 characters. Returns `mode` (`ai`, `rules` or `retrieval`), `answer`, `cited`, `records`. Rate limited. |
| POST | `/extract` | `{ text }` 80 to 20,000 characters. 503 `AI_NOT_CONFIGURED` without a key. Rate limited. |
| GET, POST | `/submissions` | POST needs `company`, `city`, `sourceUrl` (http or https). Returns 201. Rate limited. |
| GET | `/health` | `{ status, ai, records }`. |

Read endpoints send `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` so a CDN can serve them. AI and write endpoints send `no-store`.

## 6. Performance choices

- Static generation for the 62 record and provider pages; they are served as files.
- Server components by default; only the Ask and Submit forms ship JavaScript.
- Filters are a plain GET form, so results are shareable URLs and work without client code.
- One database connection per instance, cached prepared statements, indexed filters, paginated lists.
- The AI model defaults to a small, fast one, with a 25 second timeout and a fallback to retrieval.

## 7. Known gaps

- No authentication or reviewer screen: approving a submission is not built.
- Submissions are not persistent (see section 4).
- The rate limiter is per instance; it needs a shared store behind a load balancer.
- Data is a hand-checked sample of 50 centres. Ingestion at scale is designed (section 1) but not built.
- The AI paths were tested against a local stand-in for the API, not with a live key. The rule-based Ask path is tested with a live server and unit tests.
- `/market` is static reference data with source links, not a database table. State incentive terms, rents and cluster data are not collected yet.
