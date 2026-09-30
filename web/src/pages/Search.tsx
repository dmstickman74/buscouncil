import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Input, Spinner, Badge } from "@/components/ui";

interface SearchResult {
  type: "thread" | "document";
  id: number;
  title: string;
  snippet: string;
  author_name: string;
  created_at: string;
}

const RESULT_ICONS: Record<string, React.ReactNode> = {
  thread: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>,
  document: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
};

export function SearchPage() {
  const { identity } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const councilId = identity?.council_id;

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!councilId || !query.trim()) return;
    setLoading(true);
    try {
      const data = await api<SearchResult[]>(`/search?q=${encodeURIComponent(query)}&council_id=${councilId}`);
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Search" description="Find discussions and documents across your council." />

      <Card className="mb-6">
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-txt3">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              </div>
              <Input
                placeholder="Search discussions and documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardBody>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : searched && results.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            </div>
            <p className="text-txt2 mb-1 font-medium">No results found</p>
            <p className="text-sm text-txt3">Try a different search term or check your spelling.</p>
          </CardBody>
        </Card>
      ) : results.length > 0 ? (
        <>
          <p className="text-xs text-txt3 mb-3 px-1">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
          <Card>
            <div className="divide-y divide-border-light">
              {results.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  to={r.type === "thread" ? `/forum/${r.id}` : `/documents`}
                  className="group flex items-start gap-4 px-5 py-3.5 hover:bg-surface-alt transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    r.type === "thread" ? "bg-navy-50 text-navy" : "bg-blue/10 text-blue"
                  }`}>
                    {RESULT_ICONS[r.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge color={r.type === "thread" ? "navy" : "blue"}>{r.type === "thread" ? "Discussion" : "Document"}</Badge>
                      <span className="font-medium text-sm text-txt group-hover:text-navy transition-colors truncate">{r.title}</span>
                    </div>
                    <p className="text-xs text-txt3 mt-1 line-clamp-2">{r.snippet}</p>
                    <div className="text-xs text-txt3 mt-1">{r.author_name} &middot; {fmtRelative(r.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
