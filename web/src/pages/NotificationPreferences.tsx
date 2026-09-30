import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button, Card, CardBody, PageHeader, Spinner } from "@/components/ui";
import type { NotificationPreferences } from "@/lib/types";

const FREQ_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "daily", label: "Daily digest" },
  { value: "weekly", label: "Weekly digest" },
  { value: "none", label: "Off" },
];

const SETTING_CONFIG: { key: keyof NotificationPreferences; label: string; description: string; icon: React.ReactNode }[] = [
  {
    key: "forum_frequency",
    label: "Discussion replies",
    description: "Replies to threads you're subscribed to",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>,
  },
  {
    key: "dm_frequency",
    label: "Direct messages",
    description: "New messages in your conversations",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  },
  {
    key: "mention_frequency",
    label: "Mentions",
    description: "When someone @mentions you in a post",
    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" /></svg>,
  },
];

export function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<NotificationPreferences>("/notifications/preferences")
      .then(setPrefs)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    setSaving(true);
    setSaved(false);
    try {
      await api("/notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!prefs) return null;

  return (
    <div>
      <div className="mb-4">
        <Link to="/notifications" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Notifications
        </Link>
      </div>

      <PageHeader title="Notification Settings" description="Choose how often you want to receive email notifications." />

      <Card>
        <CardBody>
          <form onSubmit={handleSave} className="max-w-lg">
            <div className="divide-y divide-border-light">
              {SETTING_CONFIG.map(({ key, label, description, icon }) => (
                <div key={key} className="flex items-center gap-4 py-4">
                  <div className="w-9 h-9 rounded-xl bg-navy-50 text-navy flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-txt">{label}</div>
                    <div className="text-xs text-txt3">{description}</div>
                  </div>
                  <select
                    value={prefs[key]}
                    onChange={(e) => setPrefs({ ...prefs, [key]: e.target.value })}
                    className="rounded-xl border border-border-light bg-surface px-3 py-1.5 text-sm text-txt"
                  >
                    {FREQ_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="pt-5 flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1 text-sm text-green">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Saved!
                </span>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
