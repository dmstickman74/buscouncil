import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardBody, PageHeader, Spinner, Button } from "@/components/ui";
import type { User } from "@/lib/types";

export function MemberProfilePage() {
  const { memberId } = useParams();
  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    api<User>(`/members/${memberId}`)
      .then(setMember)
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  if (!member) {
    return <PageHeader title="Member not found" />;
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/members" className="text-sm text-navy hover:underline">&larr; Back to Members</Link>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-navy text-white flex items-center justify-center text-3xl font-bold shrink-0">
              {member.display_name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-txt">{member.display_name}</h1>
              {member.title && <div className="text-sm text-txt2 mt-1">{member.title}</div>}
              {member.company && <div className="text-sm text-txt3">{member.company}</div>}
              {member.bio && (
                <p className="text-sm text-txt mt-4 leading-relaxed">{member.bio}</p>
              )}
              <Link to={`/messages/new?to=${member.id}`} className="inline-block mt-4">
                <Button variant="secondary" size="sm">Send Message</Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
