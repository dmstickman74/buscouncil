import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardBody, Spinner, Button } from "@/components/ui";
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
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-txt mb-1">Member not found</h1>
        <p className="text-sm text-txt3">They may have been removed or you don't have access.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link to="/members" className="inline-flex items-center gap-1 text-sm text-navy hover:underline">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Members
        </Link>
      </div>

      <Card>
        <CardBody className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-3xl font-bold shrink-0 shadow-md">
              {member.display_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-txt">{member.display_name}</h1>

              {(member.title || member.company) && (
                <div className="mt-2 space-y-1">
                  {member.title && (
                    <div className="flex items-center gap-2 text-sm text-txt2">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      {member.title}
                    </div>
                  )}
                  {member.company && (
                    <div className="flex items-center gap-2 text-sm text-txt3">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                      {member.company}
                    </div>
                  )}
                </div>
              )}

              {member.bio && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-sm text-txt leading-relaxed">{member.bio}</p>
                </div>
              )}

              <div className="mt-5">
                <Link to={`/messages/new?to=${member.id}`}>
                  <Button variant="secondary" size="sm">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                    Send Message
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
