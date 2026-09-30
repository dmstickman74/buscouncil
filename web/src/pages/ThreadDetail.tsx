import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, PageHeader, Spinner, Badge, Textarea } from "@/components/ui";
import type { ThreadDetail as ThreadDetailType, Post } from "@/lib/types";

export function ThreadDetailPage() {
  const { threadId } = useParams();
  const { identity } = useAuth();
  const [thread, setThread] = useState<ThreadDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const councilId = identity?.council_id;

  useEffect(() => {
    if (!councilId || !threadId) return;
    setLoading(true);
    api<ThreadDetailType>(`/councils/${councilId}/threads/${threadId}`)
      .then(setThread)
      .finally(() => setLoading(false));
  }, [councilId, threadId]);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!councilId || !threadId || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      const post = await api<Post>(`/councils/${councilId}/threads/${threadId}/posts`, {
        method: "POST",
        body: JSON.stringify({ body: replyBody }),
      });
      setThread((prev) => prev ? {
        ...prev,
        posts: [...prev.posts, post],
        reply_count: prev.reply_count + 1,
      } : prev);
      setReplyBody("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!thread) {
    return <PageHeader title="Thread not found" />;
  }

  const openingPost = thread.posts.find((p) => p.position === 0);
  const replies = thread.posts.filter((p) => p.position > 0);

  return (
    <div>
      <div className="mb-4">
        <Link to="/forum" className="text-sm text-navy hover:underline">&larr; Back to Discussions</Link>
      </div>

      <PageHeader
        title={thread.title}
        description={`Started by ${thread.author.display_name}${thread.author.company ? `, ${thread.author.company}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {thread.pinned && <Badge color="gold">Pinned</Badge>}
            {thread.locked && <Badge color="gray">Locked</Badge>}
          </div>
        }
      />

      {openingPost && (
        <Card className="mb-4">
          <CardBody>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                {openingPost.author.display_name[0]}
              </div>
              <div>
                <div className="font-medium text-sm">{openingPost.author.display_name}</div>
                <div className="text-xs text-txt3">
                  {openingPost.author.title && <>{openingPost.author.title} &middot; </>}
                  {fmtRelative(openingPost.created_at)}
                  {openingPost.edited_at && <> &middot; edited</>}
                </div>
              </div>
            </div>
            <div className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{openingPost.body}</div>
          </CardBody>
        </Card>
      )}

      {replies.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-txt2">{replies.length} {replies.length === 1 ? "Reply" : "Replies"}</h3>
          {replies.map((post) => (
            <Card key={post.id}>
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-navy-light text-white flex items-center justify-center text-sm font-bold">
                    {post.author.display_name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{post.author.display_name}</div>
                    <div className="text-xs text-txt3">
                      {post.author.title && <>{post.author.title} &middot; </>}
                      {fmtRelative(post.created_at)}
                      {post.edited_at && <> &middot; edited</>}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{post.body}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {!thread.locked && (
        <Card>
          <CardBody>
            <form onSubmit={handleReply}>
              <Textarea
                placeholder="Write a reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
                required
              />
              <div className="mt-3 flex justify-end">
                <Button type="submit" disabled={submitting || !replyBody.trim()}>
                  {submitting ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
