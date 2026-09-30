import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import type { ConversationSummary } from "@/lib/types";

export function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ConversationSummary[]>("/conversations")
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <div>
      {/* Hero header */}
      <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark px-8 py-6 pb-7 text-white mb-6 -mt-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            <p className="text-white/60 text-sm mt-1">Direct and group messages with council members</p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold">{unreadCount}</div>
                <div className="text-xs text-white/50">unread</div>
              </div>
            )}
            <Link to="/messages/new">
              <Button variant="green" size="sm">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                New Message
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl bg-surface-alt border border-border-light py-16 px-6 text-center">
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold -rotate-6">A</div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center text-sm font-bold rotate-6 -mt-2">B</div>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-navy to-navy-dark text-white flex items-center justify-center text-sm font-bold -rotate-3">C</div>
          </div>
          <p className="text-lg font-semibold text-txt mb-1">Start a conversation</p>
          <p className="text-sm text-txt3 max-w-xs mx-auto mb-5">
            Connect with your fellow council members through direct or group messages.
          </p>
          <Link to="/messages/new"><Button>New Message</Button></Link>
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {conversations.map((c) => {
              const memberNames = c.other_members?.map((m) => m.display_name) ?? [];
              const initials = c.other_members?.[0]?.display_name?.[0] ?? "?";
              const hasUnread = c.unread;
              const preview = c.last_message?.body;

              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-surface-alt transition-colors"
                >
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0 ${hasUnread ? "ring-2 ring-gold ring-offset-2 ring-offset-surface" : ""}`}>
                      {c.is_group ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                      ) : initials}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm group-hover:text-navy transition-colors truncate ${hasUnread ? "text-txt" : "text-txt2"}`}>
                        {c.title || memberNames.join(", ") || "Conversation"}
                      </span>
                      {c.is_group && <Badge color="blue">Group</Badge>}
                    </div>
                    {preview && (
                      <div className={`text-xs mt-1 truncate ${hasUnread ? "text-txt2" : "text-txt3"}`}>{preview}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.last_message_at && (
                      <span className="text-xs text-txt3">{fmtRelative(c.last_message_at)}</span>
                    )}
                    {hasUnread && (
                      <span className="w-5 h-5 rounded-full bg-gold text-white text-[10px] font-bold flex items-center justify-center">!</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
