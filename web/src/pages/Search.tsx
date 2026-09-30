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
      <PageHeader title="Search" />

      <form onSubmit={handleSearch} className="flex gap-3 mb-6 max-w-xl">
        <Input
          placeholder="Search discussions and documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : searched && results.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-txt3">No results found for "{query}".</p>
          </CardBody>
        </Card>
      ) : results.length > 0 ? (
        <Card>
          <div className="divide-y divide-border-light">
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                to={r.type === "thread" ? `/forum/${r.id}` : `/documents`}
                className="block px-5 py-3 hover:bg-surface-alt transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Badge color={r.type === "thread" ? "navy" : "blue"}>{r.type === "thread" ? "Discussion" : "Document"}</Badge>
                  <span className="font-medium text-sm text-txt">{r.title}</span>
                </div>
                <p className="text-xs text-txt3 mt-1">{r.snippet}</p>
                <div className="text-xs text-txt3 mt-1">{r.author_name} &middot; {fmtRelative(r.created_at)}</div>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
