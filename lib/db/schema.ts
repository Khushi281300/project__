// Normalised relational schema. Written in SQLite dialect for the prototype;
// every table maps one-to-one to Postgres (see docs/ARCHITECTURE.md).
export const SCHEMA = `
CREATE TABLE city (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT ''
);

CREATE TABLE company (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  hq_country TEXT NOT NULL DEFAULT '',
  sector     TEXT NOT NULL
);

CREATE TABLE gcc (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  company_id    INTEGER NOT NULL REFERENCES company(id),
  city_id       INTEGER NOT NULL REFERENCES city(id),
  status        TEXT NOT NULL CHECK (status IN ('operational','announced')),
  opened        TEXT NOT NULL DEFAULT '',
  focus         TEXT NOT NULL DEFAULT '',
  headcount     TEXT NOT NULL DEFAULT '',
  office        TEXT NOT NULL DEFAULT '',
  caveat        TEXT NOT NULL DEFAULT '',
  -- Derived from evidence by lib/domain/verification.ts and stored so filters stay index-only.
  verification  TEXT NOT NULL CHECK (verification IN ('verified','claimed')),
  reason        TEXT NOT NULL,
  source_count  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (company_id, city_id)
);
CREATE INDEX gcc_city_idx ON gcc(city_id);
CREATE INDEX gcc_verification_idx ON gcc(verification);

CREATE TABLE provider (
  id   INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL
);

-- A provider's involvement in one GCC. This is the layer no public source has today.
CREATE TABLE engagement (
  id           INTEGER PRIMARY KEY,
  gcc_id       INTEGER NOT NULL REFERENCES gcc(id),
  provider_id  INTEGER NOT NULL REFERENCES provider(id),
  role         TEXT NOT NULL CHECK (role IN ('setup','build-operate','workspace','talent','advisory')),
  verification TEXT NOT NULL CHECK (verification IN ('verified','claimed')),
  reason       TEXT NOT NULL,
  UNIQUE (gcc_id, provider_id, role)
);
CREATE INDEX engagement_gcc_idx ON engagement(gcc_id);
CREATE INDEX engagement_provider_idx ON engagement(provider_id);

CREATE TABLE source (
  id        INTEGER PRIMARY KEY,
  url       TEXT NOT NULL UNIQUE,
  publisher TEXT NOT NULL,
  published TEXT NOT NULL DEFAULT '',
  origin    TEXT NOT NULL CHECK (origin IN ('independent','government','company','provider'))
);

-- Evidence joins a source to the thing it supports. One source can back many records.
CREATE TABLE evidence (
  id           INTEGER PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('gcc','engagement')),
  subject_id   INTEGER NOT NULL,
  source_id    INTEGER NOT NULL REFERENCES source(id),
  supports     TEXT NOT NULL,
  UNIQUE (subject_type, subject_id, source_id)
);
CREATE INDEX evidence_subject_idx ON evidence(subject_type, subject_id);

-- Review queue. Nothing submitted here is published until a person confirms it.
CREATE TABLE submission (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,
  company    TEXT NOT NULL,
  city       TEXT NOT NULL,
  provider   TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending'
);

-- Full-text index over the searchable fields of a GCC; rowid = gcc.id.
CREATE VIRTUAL TABLE gcc_fts USING fts5(
  company, city, state, sector, focus, providers, tags,
  tokenize = 'unicode61 remove_diacritics 2'
);
`;
