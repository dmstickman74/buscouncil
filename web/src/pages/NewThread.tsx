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
        <Link to="/forum" className="text-sm text-navy hover:underline">&larr; Back to Discussions</Link>
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
            {error && <p className="text-sm text-red">{error}</p>}
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
