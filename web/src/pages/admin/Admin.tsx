import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, PageHeader, Spinner } from "@/components/ui";
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {councils.map((c) => (
            <Link key={c.id} to={`/admin/councils/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardBody>
                  <h3 className="font-semibold text-txt">{c.name}</h3>
                  <div className="text-sm text-txt2 mt-1">{c.member_count} members</div>
                  {c.description && <p className="text-xs text-txt3 mt-2">{c.description}</p>}
                </CardBody>
              </Card>
            </Link>
          ))}

          <Card className="border-dashed">
            <CardBody className="flex flex-col items-center justify-center py-8 text-txt3">
              <div className="text-3xl mb-2">+</div>
              <div className="text-sm">Create Council</div>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link to="/admin/users">
          <Card className="hover:shadow-md transition-shadow">
            <CardBody>
              <h3 className="font-semibold text-txt">Manage Users</h3>
              <p className="text-sm text-txt3 mt-1">Create, edit, and deactivate user accounts.</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/admin/activity">
          <Card className="hover:shadow-md transition-shadow">
            <CardBody>
              <h3 className="font-semibold text-txt">Activity Reports</h3>
              <p className="text-sm text-txt3 mt-1">View login history, posts, and engagement metrics.</p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}
