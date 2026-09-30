import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Spinner, Badge } from "@/components/ui";
import type { ConversationSummary } from "@/lib/types";

export function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ConversationSummary[]>("/conversations")
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Direct and group messages with council members."
        actions={<Link to="/messages/new"><Button>New Message</Button></Link>}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <p className="text-txt2 mb-1 font-medium">No messages yet</p>
            <p className="text-sm text-txt3 mb-5">Start a conversation with a fellow council member.</p>
            <Link to="/messages/new"><Button>New Message</Button></Link>
          </CardBody>
        </Card>
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {c.is_group ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                    ) : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm group-hover:text-navy transition-colors truncate ${hasUnread ? "text-txt" : "text-txt2"}`}>
                        {c.title || memberNames.join(", ") || "Conversation"}
                      </span>
                      {c.is_group && <Badge color="blue">Group</Badge>}
                      {hasUnread && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                    </div>
                    {preview && (
                      <div className="text-xs text-txt3 mt-1 truncate">{preview}</div>
                    )}
                  </div>
                  {c.last_message_at && (
                    <span className="text-xs text-txt3 shrink-0">{fmtRelative(c.last_message_at)}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
