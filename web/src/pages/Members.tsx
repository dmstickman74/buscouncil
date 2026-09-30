import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardBody, PageHeader, Spinner, Badge, Input } from "@/components/ui";
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

      <div className="mb-4 max-w-sm">
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
          <CardBody className="text-center py-8">
            <p className="text-txt3">{search ? "No members match your search." : "No members found."}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Link key={m.id} to={`/members/${m.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {m.display_name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-txt truncate">{m.display_name}</div>
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
