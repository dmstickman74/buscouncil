import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Card, CardBody, PageHeader, Textarea } from "@/components/ui";
import type { User, ConversationDetail } from "@/lib/types";

export function NewConversationPage() {
  const { identity } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const to = searchParams.get("to");
    return to ? [parseInt(to, 10)] : [];
  });
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const councilId = identity?.council_id;

  useEffect(() => {
    if (!councilId) return;
    api<User[]>(`/members?council_id=${councilId}`).then((all) =>
      setMembers(all.filter((m) => m.id !== identity?.user.id))
    );
  }, [councilId, identity?.user.id]);

  function toggleMember(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0 || !body.trim()) return;
    setSubmitting(true);
    try {
      const conv = await api<ConversationDetail>("/conversations", {
        method: "POST",
        body: JSON.stringify({ member_ids: selectedIds, body }),
      });
      navigate(`/messages/${conv.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/messages" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Messages
        </Link>
      </div>

      <PageHeader title="New Message" />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-txt mb-2">To</label>
              <div className="flex flex-wrap gap-2 p-3 border border-border-light rounded-xl bg-surface min-h-12">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedIds.includes(m.id)
                        ? "bg-navy text-white shadow-sm"
                        : "bg-surface-alt text-txt2 border border-border-light hover:border-navy/20 hover:text-navy"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      selectedIds.includes(m.id)
                        ? "bg-white/20 text-white"
                        : "bg-gradient-to-br from-navy to-navy-light text-white"
                    }`}>
                      {m.display_name[0]}
                    </span>
                    {m.display_name}
                  </button>
                ))}
              </div>
              {selectedIds.length > 0 && (
                <p className="text-xs text-txt3 mt-1.5">{selectedIds.length} recipient{selectedIds.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>

            <Textarea
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write your message..."
              required
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || selectedIds.length === 0 || !body.trim()}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
