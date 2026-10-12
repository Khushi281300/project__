import type { DatabaseSync } from "node:sqlite";
import { SCHEMA } from "./schema";
import { seedDatabase } from "./seed";

// One connection per server instance, created on first use and reused across requests.
// The prototype keeps the database in memory and rebuilds it from data/seed.json on cold start,
// so it runs anywhere with no setup. Swapping in Postgres means replacing this file and the SQL in lib/repo.
const holder = globalThis as unknown as { __ledgerDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!holder.__ledgerDb) {
    // getBuiltinModule keeps the bundler from trying to resolve a Node built-in.
    const { DatabaseSync } = process.getBuiltinModule("node:sqlite");
    const conn = new DatabaseSync(":memory:");
    conn.exec("PRAGMA foreign_keys = ON");
    conn.exec(SCHEMA);
    seedDatabase(conn);
    holder.__ledgerDb = conn;
  }
  return holder.__ledgerDb;
}
