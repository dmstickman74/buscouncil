import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardBody, PageHeader, Spinner, Input } from "@/components/ui";
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
      <PageHeader
        title="Member Directory"
        description="Connect with your fellow council members."
      />

      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <p className="text-sm text-txt3">{search ? "No members match your search." : "No members found."}</p>
          </CardBody>
        </Card>
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
