import { useEffect, useState, useRef, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, Spinner, Textarea } from "@/components/ui";
import type { ConversationDetail as ConvDetailType, MessageRead } from "@/lib/types";

export function ConversationDetailPage() {
  const { conversationId } = useParams();
  const { identity } = useAuth();
  const [conv, setConv] = useState<ConvDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    api<ConvDetailType>(`/conversations/${conversationId}`)
      .then(setConv)
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!conversationId || !body.trim()) return;
    setSending(true);
    try {
      const msg = await api<MessageRead>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setConv((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!conv) {
    return <div className="text-center py-12 text-txt3">Conversation not found.</div>;
  }

  const title = conv.title || conv.members.map((m) => m.display_name).filter((n) => n !== identity?.user.display_name).join(", ");

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="mb-4">
        <Link to="/messages" className="text-sm text-navy hover:underline">&larr; Back to Messages</Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-bold text-txt">{title}</h1>
        <span className="text-xs text-txt3">{conv.members.length} members</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {conv.messages.map((msg) => {
          const isMine = msg.author_id === identity?.user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                isMine ? "bg-navy text-white" : "bg-surface-alt text-txt"
              }`}>
                {!isMine && <div className="text-xs font-medium mb-1 opacity-75">{msg.author_name}</div>}
                <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                <div className={`text-xs mt-1 ${isMine ? "text-white/60" : "text-txt3"}`}>
                  {fmtRelative(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <Card className="sticky bottom-0">
        <CardBody>
          <form onSubmit={handleSend} className="flex gap-3">
            <Textarea
              placeholder="Type a message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={1}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (body.trim()) handleSend(e);
                }
              }}
            />
            <Button type="submit" disabled={sending || !body.trim()}>Send</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
