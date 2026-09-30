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

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <Card>
            <CardBody className="flex flex-col items-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-3xl font-bold shadow-md mb-3">
                {displayName?.[0] || "?"}
              </div>
              <div className="text-center">
                <div className="font-medium text-txt">{displayName || "Your Name"}</div>
                {title && <div className="text-xs text-txt2 mt-0.5">{title}</div>}
                {company && <div className="text-xs text-txt3">{company}</div>}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex-1">
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Principal, VP of Design" />
                  <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Smith Landscape Architecture" />
                </div>
                <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
                <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell other members about yourself and your practice..." />
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  {saved && (
                    <span className="inline-flex items-center gap-1 text-sm text-green">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      Profile updated!
                    </span>
                  )}
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
