import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Spinner, Badge } from "@/components/ui";
import type { ConversationSummary } from "@/lib/types";

export function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          <CardBody className="text-center py-8">
            <p className="text-txt3 mb-4">No messages yet. Start a conversation!</p>
            <Link to="/messages/new"><Button>New Message</Button></Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-border-light">
            {conversations.map((c) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-alt transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${c.has_unread ? "text-txt" : "text-txt2"}`}>
                      {c.title || c.member_names.join(", ")}
                    </span>
                    {c.is_group && <Badge color="blue">Group</Badge>}
                    {c.has_unread && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                  </div>
                  {c.last_message_preview && (
                    <div className="text-xs text-txt3 mt-1 truncate">{c.last_message_preview}</div>
                  )}
                </div>
                {c.last_message_at && (
                  <span className="text-xs text-txt3 shrink-0">{fmtRelative(c.last_message_at)}</span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
