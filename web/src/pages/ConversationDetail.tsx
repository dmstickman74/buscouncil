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
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-txt mb-1">Conversation not found</h1>
        <p className="text-sm text-txt3">It may have been removed or you don't have access.</p>
      </div>
    );
  }

  const title = conv.title || conv.members.map((m) => m.display_name).filter((n) => n !== identity?.user.display_name).join(", ");

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="mb-4">
        <Link to="/messages" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Messages
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0">
          {title[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold text-txt">{title}</h1>
          <span className="text-xs text-txt3">{conv.members.length} members</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {conv.messages.map((msg) => {
          const isMine = msg.author.id === identity?.user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  {msg.author.display_name[0]}
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMine ? "bg-navy text-white" : "bg-surface-alt text-txt"
              }`}>
                {!isMine && <div className="text-xs font-medium mb-1 opacity-75">{msg.author.display_name}</div>}
                <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                <div className={`text-xs mt-1 ${isMine ? "text-white/60" : "text-txt3"}`}>
                  {fmtRelative(msg.created_at)}
                </div>
              </div>
              {isMine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                  {identity?.user.display_name[0]}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <Card className="sticky bottom-0">
        <CardBody>
          <form onSubmit={handleSend} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
              {identity?.user.display_name[0]}
            </div>
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
            <Button type="submit" disabled={sending || !body.trim()}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              Send
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
