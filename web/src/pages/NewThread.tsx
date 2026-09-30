import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Card, CardBody, PageHeader, Input, Textarea } from "@/components/ui";
import type { ThreadDetail } from "@/lib/types";

export function NewThreadPage() {
  const { identity } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const councilId = identity?.council_id;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!councilId) return;
    setError("");
    setSubmitting(true);
    try {
      const thread = await api<ThreadDetail>(`/councils/${councilId}/threads`, {
        method: "POST",
        body: JSON.stringify({ title, body }),
      });
      navigate(`/forum/${thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create discussion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Discussions
        </Link>
      </div>

      <PageHeader title="New Discussion" />

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to discuss?"
              required
              autoFocus
            />
            <Textarea
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts..."
              rows={6}
              required
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Link to="/forum"><Button variant="secondary" type="button">Cancel</Button></Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Posting..." : "Post Discussion"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
