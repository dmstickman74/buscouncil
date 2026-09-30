import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardBody, PageHeader, Spinner, Badge } from "@/components/ui";
import type { Council } from "@/lib/types";

export function AdminPage() {
  const [councils, setCouncils] = useState<Council[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Council[]>("/admin/councils")
      .then(setCouncils)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Admin" description="Manage councils, members, and view activity." />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : (
        <>
          <h2 className="text-xs font-medium text-txt3 uppercase tracking-wider mb-3 px-1">Councils</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {councils.map((c) => (
              <Link key={c.id} to={`/admin/councils/${c.id}`} className="group">
                <Card className="hover:shadow-md hover:border-navy/15 transition-all h-full">
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-navy-light text-white flex items-center justify-center text-lg font-bold shrink-0">
                        {c.name[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-txt group-hover:text-navy transition-colors">{c.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge color="sage">{c.member_count} members</Badge>
                          {!c.active && <Badge color="red">Inactive</Badge>}
                        </div>
                        {c.description && <p className="text-xs text-txt3 mt-2 line-clamp-2">{c.description}</p>}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}

            <Card className="border-dashed hover:border-navy/20 transition-colors">
              <CardBody className="flex flex-col items-center justify-center py-8 text-txt3 hover:text-navy transition-colors">
                <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center mb-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <div className="text-sm font-medium">Create Council</div>
              </CardBody>
            </Card>
          </div>

          <h2 className="text-xs font-medium text-txt3 uppercase tracking-wider mb-3 px-1">Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/admin/users" className="group">
              <Card className="hover:shadow-md hover:border-navy/15 transition-all">
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy flex items-center justify-center shrink-0">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-txt group-hover:text-navy transition-colors">Manage Users</h3>
                    <p className="text-sm text-txt3 mt-0.5">Create, edit, and deactivate user accounts.</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
            <Link to="/admin/activity" className="group">
              <Card className="hover:shadow-md hover:border-navy/15 transition-all">
                <CardBody className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy flex items-center justify-center shrink-0">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-txt group-hover:text-navy transition-colors">Activity Reports</h3>
                    <p className="text-sm text-txt3 mt-0.5">View login history, posts, and engagement metrics.</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
