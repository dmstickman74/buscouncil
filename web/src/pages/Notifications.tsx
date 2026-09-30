import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Button, Card, CardBody, PageHeader, Spinner, Badge } from "@/components/ui";
import type { NotificationItem, NotificationsResponse } from "@/lib/types";

export function NotificationsPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<NotificationsResponse>("/notifications")
      .then((data) => setNotifications(data.notifications))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await api("/notifications/read", {
      method: "POST",
      body: JSON.stringify({ ids: unreadIds }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  }

  function handleClick(n: NotificationItem) {
    if (!n.read) {
      api("/notifications/read", {
        method: "POST",
        body: JSON.stringify({ ids: [n.id] }),
      });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      refresh();
    }
    navigate(n.link);
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={markAllRead}>Mark All Read</Button>
            <Link to="/notifications/preferences">
              <Button variant="ghost" size="sm">Settings</Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-txt3">No notifications yet.</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left flex items-start gap-3 px-5 py-3 hover:bg-surface-alt transition-colors ${
                  !n.read ? "bg-gold/5" : ""
                }`}
              >
                {!n.read && <span className="w-2 h-2 mt-1.5 rounded-full bg-gold shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-txt">{n.title}</div>
                  {n.body && <div className="text-xs text-txt3 mt-0.5 truncate">{n.body}</div>}
                  <div className="text-xs text-txt3 mt-1">{fmtRelative(n.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
