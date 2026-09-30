import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { Button, Card, CardBody, Spinner, Badge, Input } from "@/components/ui";
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

const CHAIR_ROLES = ["chair", "vice_chair_membership", "vice_chair_programming"];

export function MeetingsPage() {
  const { identity, can } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");

  const councilId = identity?.council_id;
  const isAdmin = can("admin.full");
  const isChair = CHAIR_ROLES.includes(identity?.council_role || "");
  const canManage = isAdmin || isChair;

  useEffect(() => {
    if (!councilId) return;
    api<Meeting[]>(`/councils/${councilId}/meetings`)
      .then(setMeetings)
      .finally(() => setLoading(false));
  }, [councilId]);

  function resetForm() {
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setMeetingLink("");
    setDescription("");
    setFormError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!councilId) return;
    if (!title.trim()) { setFormError("Title is required"); return; }
    if (!date) { setFormError("Date is required"); return; }
    if (!time) { setFormError("Time is required"); return; }

    setSaving(true);
    setFormError("");

    try {
      const meetingDate = `${date}T${time}:00`;
      const newMeeting = await api<Meeting>(`/councils/${councilId}/meetings`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          meeting_date: meetingDate,
          location: location.trim() || null,
          meeting_link: meetingLink.trim() || null,
          description: description.trim() || null,
        }),
      });
      setMeetings((prev) => [newMeeting, ...prev].sort(
        (a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
      ));
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setSaving(false);
    }
  }

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
            <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark px-8 py-6 pb-7 text-white -mt-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Next Meeting</div>
                {canManage && (
                  <Button
                    variant="green"
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Meeting
                  </Button>
                )}
              </div>
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
            <div className="rounded-2xl bg-gradient-to-br from-navy via-navy-light to-navy-dark px-8 py-6 pb-7 text-white -mt-1">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-white/40"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
                  <p className="text-white/50 text-sm mt-1">No upcoming meetings scheduled yet.</p>
                </div>
                {canManage && (
                  <Button
                    variant="green"
                    size="sm"
                    onClick={() => setShowForm(!showForm)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Meeting
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Add Meeting form */}
          {showForm && (
            <Card className="border-navy/20 shadow-md">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-txt">Schedule a Meeting</h2>
                  <button
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="text-txt3 hover:text-txt transition-colors p-1"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Meeting Title"
                    placeholder="e.g. Q1 Business Council Meeting"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    <Input
                      label="Time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Location"
                      placeholder="e.g. ASLA Center, Washington DC"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <Input
                      label="Meeting Link"
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-txt2">Description (optional)</label>
                    <textarea
                      placeholder="Agenda or notes for this meeting..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="px-4 py-3 border border-border rounded-[var(--radius-card)] text-sm bg-surface text-txt focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy/40 resize-none"
                    />
                  </div>

                  {formError && (
                    <div className="flex items-center gap-2 text-sm text-red">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      {formError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                          Schedule Meeting
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setShowForm(false); resetForm(); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
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
                    <div key={m.id} className="flex items-center gap-4 px-5 py-4 opacity-75">
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
