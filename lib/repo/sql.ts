import type { StatementSync } from "node:sqlite";
import { db } from "@/lib/db/client";

// Prepared statements are compiled once per connection and reused.
const cache = new Map<string, StatementSync>();

export function stmt(sql: string): StatementSync {
  let s = cache.get(sql);
  if (!s) {
    s = db().prepare(sql);
    cache.set(sql, s);
  }
  return s;
}

// Turns free text into a safe FTS5 query: quoted prefix terms, joined by AND or OR.
export function ftsQuery(text: string, join: "AND" | "OR", stop: Set<string> = new Set()): string {
  const terms = (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => t.length > 1 && !stop.has(t));
  return [...new Set(terms)].slice(0, 12).map((t) => `"${t}"*`).join(` ${join} `);
}
