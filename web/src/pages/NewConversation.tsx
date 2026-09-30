import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Card, CardBody, PageHeader, Input, Textarea } from "@/components/ui";
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
        <Link to="/messages" className="text-sm text-navy hover:underline">&larr; Back to Messages</Link>
      </div>

      <PageHeader title="New Message" />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-txt mb-2">To</label>
              <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-surface min-h-12">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedIds.includes(m.id)
                        ? "bg-navy text-white"
                        : "bg-surface-alt text-txt2 hover:bg-border-light"
                    }`}
                  >
                    {m.display_name}
                  </button>
                ))}
              </div>
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
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
