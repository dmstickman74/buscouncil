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

function FreqSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-txt">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-txt"
      >
        {FREQ_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

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
        <Link to="/notifications" className="text-sm text-navy hover:underline">&larr; Back to Notifications</Link>
      </div>

      <PageHeader title="Notification Settings" description="Choose how often you want to receive email notifications." />

      <Card>
        <CardBody>
          <form onSubmit={handleSave} className="max-w-md divide-y divide-border-light">
            <FreqSelect
              label="Discussion replies"
              value={prefs.forum_frequency}
              onChange={(v) => setPrefs({ ...prefs, forum_frequency: v })}
            />
            <FreqSelect
              label="Direct messages"
              value={prefs.dm_frequency}
              onChange={(v) => setPrefs({ ...prefs, dm_frequency: v })}
            />
            <FreqSelect
              label="Mentions"
              value={prefs.mention_frequency}
              onChange={(v) => setPrefs({ ...prefs, mention_frequency: v })}
            />
            <div className="pt-4 flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
              {saved && <span className="text-sm text-green">Saved!</span>}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
