import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Spinner, Badge, Input } from "@/components/ui";
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
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Admin
        </Link>
      </div>

      <PageHeader
        title="Manage Users"
        description="Create, search, and manage user accounts."
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                Create User
              </>
            )}
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
                  className="w-full rounded-xl border border-border-light bg-surface px-3 py-2 text-sm"
                >
                  {COUNCIL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                  <option value="admin">Admin (Staff)</option>
                </select>
              </div>
              <Input label="Job Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Optional" />
              <Input label="Company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Optional" />
              {error && (
                <div className="md:col-span-2 flex items-center gap-2 text-sm text-red">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  {error}
                </div>
              )}
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : users.length === 0 ? (
        <Card>
          <CardBody className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <p className="text-sm text-txt3">{search ? "No users match your search." : "No users found."}</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0">
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
                  variant={u.active ? "danger" : "green"}
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
