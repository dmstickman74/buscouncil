import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtRelative } from "@/lib/format";
import { Button, Card, CardBody, Spinner, Badge, Textarea } from "@/components/ui";
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
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-txt mb-1">Thread not found</h1>
        <p className="text-sm text-txt3">It may have been removed or you don't have access.</p>
      </div>
    );
  }

  const openingPost = thread.posts.find((p) => p.position === 0);
  const replies = thread.posts.filter((p) => p.position > 0);

  return (
    <div>
      <div className="mb-4">
        <Link to="/forum" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Discussions
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {thread.pinned && <Badge color="gold">Pinned</Badge>}
            {thread.locked && <Badge color="gray">Locked</Badge>}
          </div>
          <h1 className="text-2xl font-bold text-txt">{thread.title}</h1>
          <p className="text-sm text-txt3 mt-1">
            Started by {thread.author.display_name}{thread.author.company ? `, ${thread.author.company}` : ""}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-50 text-navy text-sm font-medium shrink-0">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
          {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
        </div>
      </div>

      {openingPost && (
        <Card className="mb-4">
          <CardBody>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold">
                {openingPost.author.display_name[0]}
              </div>
              <div>
                <div className="font-medium text-sm text-txt">{openingPost.author.display_name}</div>
                <div className="text-xs text-txt3">
                  {openingPost.author.title && <>{openingPost.author.title} &middot; </>}
                  {fmtRelative(openingPost.created_at)}
                  {openingPost.edited_at && <> &middot; <span className="italic">edited</span></>}
                </div>
              </div>
            </div>
            <div className="text-sm text-txt leading-relaxed whitespace-pre-wrap pl-[52px]">{openingPost.body}</div>
          </CardBody>
        </Card>
      )}

      {replies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-txt3 uppercase tracking-wider mb-3 px-1">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h3>
          <div className="space-y-3">
            {replies.map((post) => (
              <Card key={post.id}>
                <CardBody>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-light to-navy text-white flex items-center justify-center text-sm font-bold">
                      {post.author.display_name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-txt">{post.author.display_name}</div>
                      <div className="text-xs text-txt3">
                        {post.author.title && <>{post.author.title} &middot; </>}
                        {fmtRelative(post.created_at)}
                        {post.edited_at && <> &middot; <span className="italic">edited</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-txt leading-relaxed whitespace-pre-wrap pl-[52px]">{post.body}</div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!thread.locked ? (
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-sm font-bold shrink-0">
                {identity?.user.display_name[0]}
              </div>
              <form onSubmit={handleReply} className="flex-1">
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
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex items-center gap-3 text-sm text-txt3">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            This discussion is locked. No new replies can be posted.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
