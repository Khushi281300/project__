import type { Origin, Role, SourceRef, Verification } from "@/lib/types";

export const ROLE_LABEL: Record<Role, string> = {
  setup: "Set-up partner",
  "build-operate": "Build-operate partner",
  workspace: "Workspace provider",
  talent: "Talent partner",
  advisory: "Advisor",
};

const ORIGIN_LABEL: Record<Origin, string> = {
  independent: "Independent press",
  government: "Government",
  company: "The company itself",
  provider: "The provider itself",
};

export function Badge({ status }: { status: Verification }) {
  return <span className={`badge ${status}`}>{status === "verified" ? "Verified" : "Claimed"}</span>;
}

export function SourceList({ sources }: { sources: SourceRef[] }) {
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.id}>
          <div className="row">
            <b>{s.publisher}</b>
            <span className="tag">{ORIGIN_LABEL[s.origin]}</span>
            {s.published && <span className="muted small">{s.published}</span>}
          </div>
          <p>{s.supports}</p>
          <a className="small" href={s.url} target="_blank" rel="noopener noreferrer">Open the source</a>
        </li>
      ))}
    </ul>
  );
}
