import type { Submission } from "@/lib/types";
import { stmt } from "./sql";

export type NewSubmission = Omit<Submission, "id" | "createdAt" | "status">;

const COLUMNS = `id, created_at AS createdAt, company, city, provider, role, source_url AS sourceUrl, note, status`;

export function createSubmission(s: NewSubmission): Submission {
  const res = stmt(`INSERT INTO submission (created_at, company, city, provider, role, source_url, note) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    new Date().toISOString(), s.company, s.city, s.provider, s.role, s.sourceUrl, s.note,
  );
  return stmt(`SELECT ${COLUMNS} FROM submission WHERE id = ?`).get(Number(res.lastInsertRowid)) as unknown as Submission;
}

export function listSubmissions(limit = 20): Submission[] {
  return stmt(`SELECT ${COLUMNS} FROM submission ORDER BY id DESC LIMIT ?`).all(limit) as unknown as Submission[];
}
