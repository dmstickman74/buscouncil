import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button, Card, CardBody, CardHeader, PageHeader, Spinner, Badge } from "@/components/ui";
import type { Council, CouncilMember, User } from "@/lib/types";
import { COUNCIL_ROLES, COUNCIL_ROLE_LABELS } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  chair: "gold",
  vice_chair_membership: "blue",
  vice_chair_programming: "blue",
  firm_member: "sage",
  industry_member: "green",
};

export function AdminCouncilDetailPage() {
  const { councilId } = useParams();
  const [council, setCouncil] = useState<Council | null>(null);
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addRole, setAddRole] = useState("firm_member");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!councilId) return;
    Promise.all([
      api<Council>(`/admin/councils/${councilId}`),
      api<CouncilMember[]>(`/admin/councils/${councilId}/members`),
      api<User[]>("/admin/users"),
    ])
      .then(([c, m, u]) => {
        setCouncil(c);
        setMembers(m);
        setAllUsers(u);
      })
      .finally(() => setLoading(false));
  }, [councilId]);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id) && u.active);

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!councilId || !selectedUserId) return;
    setAdding(true);
    try {
      const member = await api<CouncilMember>(`/admin/councils/${councilId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: parseInt(selectedUserId), role: addRole }),
      });
      setMembers((prev) => [...prev, member]);
      setSelectedUserId("");
      setAddRole("firm_member");
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId: number) {
    if (!councilId) return;
    await api(`/admin/councils/${councilId}/members/${userId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  }

  async function handleRoleChange(userId: number, newRole: string) {
    if (!councilId) return;
    await api(`/admin/councils/${councilId}/members/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    setMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
    );
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!council) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-txt mb-1">Council not found</h1>
        <p className="text-sm text-txt3">It may have been removed.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Admin
        </Link>
      </div>

      <PageHeader
        title={council.name}
        description={council.description || undefined}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                Add Member
              </>
            )}
          </Button>
        }
      />

      {showAddForm && (
        <Card className="mb-4">
          <CardBody>
            <form onSubmit={handleAddMember} className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-txt mb-1">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-xl border border-border-light bg-surface px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="rounded-xl border border-border-light bg-surface px-3 py-2 text-sm"
                >
                  {COUNCIL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={adding || !selectedUserId}>
                {adding ? "Adding..." : "Add"}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-txt">Members</h2>
            <Badge color="sage">{members.length}</Badge>
          </div>
        </CardHeader>
        <div className="divide-y divide-border-light">
          {members.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <p className="text-sm text-txt3">No members yet. Add members above.</p>
            </div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {m.display_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-txt">{m.display_name}</div>
                  <div className="text-xs text-txt3">{m.email}</div>
                  {m.company && <div className="text-xs text-txt3">{m.company}</div>}
                </div>
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                  className="rounded-xl border border-border-light bg-surface px-2 py-1 text-xs"
                >
                  {COUNCIL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <Badge color={(ROLE_COLORS[m.role] || "gray") as any}>
                  {COUNCIL_ROLE_LABELS[m.role] || m.role}
                </Badge>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemove(m.user_id)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
