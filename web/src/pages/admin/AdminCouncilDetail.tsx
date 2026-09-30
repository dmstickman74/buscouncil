import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, CardHeader, PageHeader, Spinner, Badge, Input } from "@/components/ui";
import type { Council, CouncilMember, User } from "@/lib/types";
import { COUNCIL_ROLES, COUNCIL_ROLE_LABELS } from "@/lib/types";

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
    return <PageHeader title="Council not found" />;
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin" className="text-sm text-navy hover:underline">&larr; Back to Admin</Link>
      </div>

      <PageHeader
        title={council.name}
        description={council.description || undefined}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add Member"}
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
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
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
          <h2 className="font-semibold text-txt">Members ({members.length})</h2>
        </CardHeader>
        <div className="divide-y divide-border-light">
          {members.length === 0 ? (
            <div className="p-5 text-sm text-txt3">No members yet.</div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
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
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                >
                  {COUNCIL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <Badge color={m.role.startsWith("vice_chair") ? "blue" : m.role === "chair" ? "gold" : m.role === "industry_member" ? "green" : "gray"}>
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
