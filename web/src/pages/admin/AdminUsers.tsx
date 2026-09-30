import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, CardHeader, PageHeader, Spinner, Badge, Input } from "@/components/ui";
import type { User } from "@/lib/types";
import { COUNCIL_ROLES } from "@/lib/types";

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("firm_member");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    api<User[]>(`/admin/users${params}`)
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [search]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const user = await api<User>("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          display_name: newName,
          password: newPassword,
          title: newTitle || null,
          company: newCompany || null,
          role_key: newRole,
        }),
      });
      setUsers((prev) => [...prev, user]);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewTitle("");
      setNewCompany("");
      setNewRole("firm_member");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(userId: number, currentlyActive: boolean) {
    const updated = await api<User>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ active: !currentlyActive }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin" className="text-sm text-navy hover:underline">&larr; Back to Admin</Link>
      </div>

      <PageHeader
        title="Manage Users"
        description="Create, search, and manage user accounts."
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "Create User"}
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <CardBody>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              <Input label="Display Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <Input label="Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <div>
                <label className="block text-sm font-medium text-txt mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  {COUNCIL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                  <option value="admin">Admin (Staff)</option>
                </select>
              </div>
              <Input label="Job Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Optional" />
              <Input label="Company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Optional" />
              {error && <p className="text-sm text-red md:col-span-2">{error}</p>}
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {u.display_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-txt">{u.display_name}</span>
                    {!u.active && <Badge color="red">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-txt3">{u.email}</div>
                  {(u.title || u.company) && (
                    <div className="text-xs text-txt3">
                      {[u.title, u.company].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-xs text-txt3 shrink-0">
                  {u.last_login_at ? `Last login ${fmtRelative(u.last_login_at)}` : "Never logged in"}
                </div>
                <Button
                  variant={u.active ? "danger" : "secondary"}
                  size="sm"
                  onClick={() => toggleActive(u.id, u.active)}
                >
                  {u.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
