import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Card, CardBody, PageHeader, Input, Textarea } from "@/components/ui";

export function MyProfilePage() {
  const { identity, refresh } = useAuth();
  const user = identity?.user;

  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [title, setTitle] = useState(user?.title || "");
  const [company, setCompany] = useState(user?.company || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api("/members/me", {
        method: "PUT",
        body: JSON.stringify({ display_name: displayName, title, company, phone, bio }),
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" description="Update your information visible to other council members." />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
            <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            <Input label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Principal, VP of Design" />
            <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Smith Landscape Architecture" />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell other members about yourself and your practice..." />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {saved && <span className="text-sm text-green">Profile updated!</span>}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
