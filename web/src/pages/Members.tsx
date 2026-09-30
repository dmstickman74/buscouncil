import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardBody, Spinner } from "@/components/ui";
import type { User } from "@/lib/types";

export function MembersPage() {
  const { identity } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const councilId = identity?.council_id;

  useEffect(() => {
    if (!councilId) return;
    api<User[]>(`/members?council_id=${councilId}`)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [councilId]);

  const filtered = search
    ? members.filter((m) =>
        m.display_name.toLowerCase().includes(search.toLowerCase()) ||
        m.company?.toLowerCase().includes(search.toLowerCase()) ||
        m.title?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div>
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark px-8 py-6 pb-7 text-white mb-6 -mt-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Member Directory</h1>
            <p className="text-white/60 text-sm mt-1">Connect with your fellow council members</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-xs text-white/50">members</div>
          </div>
        </div>
        {/* Search inside hero */}
        <div className="mt-4 max-w-sm">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            </div>
            <input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/15"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface-alt border border-border-light py-14 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
          <p className="text-lg font-semibold text-txt mb-1">{search ? "No matches" : "No members found"}</p>
          <p className="text-sm text-txt3">{search ? `No members match "${search}".` : "Members will appear here once they're added to your council."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Link key={m.id} to={`/members/${m.id}`} className="group">
              <Card className="hover:shadow-md hover:border-navy/15 transition-all h-full">
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
                    {m.display_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-txt group-hover:text-navy transition-colors truncate">{m.display_name}</div>
                    {m.title && <div className="text-xs text-txt2 truncate">{m.title}</div>}
                    {m.company && <div className="text-xs text-txt3 truncate">{m.company}</div>}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
