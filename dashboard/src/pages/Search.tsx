import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiGet } from "../lib/api";

interface SearchResults {
  tasks: { id: string; title: string; entity_id: string }[];
  projects: { id: string; title: string; entity_id: string }[];
  meetings: { id: string; title: string; entity_id: string; scheduled_at: string }[];
  outreach: { id: string; contact_name: string; organization: string | null; entity_id: string }[];
}

export function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const q = (location.state as { q?: string })?.q ?? "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    apiGet<SearchResults>(`/search?q=${encodeURIComponent(q)}`)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  if (!q) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Enter a search term in the header and submit.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Search: &quot;{q}&quot;</h2>
      {loading ? (
        <p className="text-gray-400">Searching…</p>
      ) : results ? (
        <div className="space-y-6">
          {results.tasks.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-gray-400">Tasks</h3>
              <ul className="space-y-1">
                {results.tasks.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => navigate("/tasks")}
                      className="text-white hover:underline"
                    >
                      {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.projects.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-gray-400">Projects</h3>
              <ul className="space-y-1">
                {results.projects.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => navigate("/projects")} className="text-white hover:underline">
                      {p.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.meetings.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-gray-400">Meetings</h3>
              <ul className="space-y-1">
                {results.meetings.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => navigate("/meetings")} className="text-white hover:underline">
                      {m.title} — {new Date(m.scheduled_at).toLocaleString()}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.outreach.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-medium text-gray-400">Outreach</h3>
              <ul className="space-y-1">
                {results.outreach.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => navigate("/outreach")} className="text-white hover:underline">
                      {o.contact_name} {o.organization ? `(${o.organization})` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.tasks.length === 0 &&
            results.projects.length === 0 &&
            results.meetings.length === 0 &&
            results.outreach.length === 0 && (
              <p className="text-gray-500">No results.</p>
            )}
        </div>
      ) : null}
    </div>
  );
}
