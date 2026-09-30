import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { Button, Card, CardBody, Spinner, Badge } from "@/components/ui";
import type { Meeting } from "@/lib/types";

function CalendarBlock({ date, size = "md" }: { date: string; size?: "md" | "lg" }) {
  const d = new Date(date);
  const month = d.toLocaleString("en", { month: "short" }).toUpperCase();
  const day = d.getDate();
  const weekday = d.toLocaleString("en", { weekday: "short" });

  if (size === "lg") {
    return (
      <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex flex-col items-center justify-center shrink-0">
        <span className="text-[10px] font-bold tracking-wider text-white/70 leading-none">{month}</span>
        <span className="text-3xl font-bold text-white leading-tight">{day}</span>
        <span className="text-[10px] text-white/50 leading-none">{weekday}</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl bg-navy-50 flex flex-col items-center justify-center shrink-0">
      <span className="text-[10px] font-bold tracking-wider text-navy/70 leading-none">{month}</span>
      <span className="text-xl font-bold text-navy leading-tight">{day}</span>
    </div>
  );
}

export function MeetingsPage() {
  const { identity } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const councilId = identity?.council_id;

  useEffect(() => {
    if (!councilId) return;
    api<Meeting[]>(`/councils/${councilId}/meetings`)
      .then(setMeetings)
      .finally(() => setLoading(false));
  }, [councilId]);

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.meeting_date) >= now);
  const past = meetings.filter((m) => new Date(m.meeting_date) < now);
  const nextMeeting = upcoming[0];

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
      ) : (
        <div className="space-y-6">
          {/* Hero — next meeting or empty state */}
          {nextMeeting ? (
            <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark p-6 text-white -mt-2">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Next Meeting</div>
              <div className="flex items-start gap-5">
                <CalendarBlock date={nextMeeting.meeting_date} size="lg" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold tracking-tight">{nextMeeting.title}</h1>
                  <div className="text-sm text-white/70 mt-1">{fmtDateTime(nextMeeting.meeting_date)}</div>
                  {nextMeeting.location && (
                    <div className="flex items-center gap-1.5 text-sm text-white/60 mt-1">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                      {nextMeeting.location}
                    </div>
                  )}
                  {nextMeeting.description && (
                    <p className="text-sm text-white/50 mt-2 line-clamp-2">{nextMeeting.description}</p>
                  )}
                  {nextMeeting.meeting_link && (
                    <a href={nextMeeting.meeting_link} target="_blank" rel="noreferrer" className="inline-block mt-3">
                      <Button variant="green" size="sm">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                        Join Meeting
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark p-6 text-white -mt-2">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-white/40"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
                  <p className="text-white/50 text-sm mt-1">No upcoming meetings scheduled yet. Check back soon.</p>
                </div>
              </div>
            </div>
          )}

          {/* Remaining upcoming */}
          {upcoming.length > 1 && (
            <div>
              <h2 className="text-xs font-medium text-txt3 uppercase tracking-wider mb-3 px-1">
                {upcoming.length - 1} more upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.slice(1).map((m) => (
                  <Card key={m.id} className="group hover:shadow-md hover:border-navy/15 transition-all">
                    <CardBody>
                      <div className="flex items-start gap-4">
                        <CalendarBlock date={m.meeting_date} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-txt group-hover:text-navy transition-colors">{m.title}</span>
                            <Badge color="green">Upcoming</Badge>
                          </div>
                          <div className="text-sm text-txt2 mt-1">{fmtDateTime(m.meeting_date)}</div>
                          {m.location && (
                            <div className="flex items-center gap-1.5 text-sm text-txt3 mt-1">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                              {m.location}
                            </div>
                          )}
                        </div>
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer" className="shrink-0">
                            <Button variant="green" size="sm">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                              Join
                            </Button>
                          </a>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past meetings */}
          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-txt3 uppercase tracking-wider mb-3 px-1">Past Meetings</h2>
              <Card>
                <div className="divide-y divide-border-light">
                  {past.map((m) => (
                    <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 opacity-75">
                      <CalendarBlock date={m.meeting_date} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-txt">{m.title}</div>
                        <div className="text-xs text-txt3 mt-0.5">{fmtDateTime(m.meeting_date)}</div>
                        {m.location && <div className="text-xs text-txt3">{m.location}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
