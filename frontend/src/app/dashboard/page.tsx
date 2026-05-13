"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { ChatBubbleLeftRightIcon, UserGroupIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { questionsApi, groupsApi, peerApi, type Question, type GroupStudy, type PeerClass } from "@/lib/api";
import { PageContainer, SectionHeader } from "@/components/ui/Page";
import { Calendar } from "@/components/ui/Calendar";
import { Avatar } from "@/components/ui/Avatar";

export default function DashboardPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [groups, setGroups] = useState<GroupStudy[]>([]);
  const [classes, setClasses] = useState<PeerClass[]>([]);
  // removed quick filters and all courses
  const [myQuestions, setMyQuestions] = useState<Question[]>([]);
  const [myGroups, setMyGroups] = useState<GroupStudy[]>([]);
  const [myClasses, setMyClasses] = useState<PeerClass[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupStudy[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<PeerClass[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Question[]>([]);
  const [activityTab, setActivityTab] = useState<'questions' | 'groups' | 'classes' | 'joinedGroups' | 'joinedClasses' | 'answered'>('questions');
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [classesTotal, setClassesTotal] = useState(0);
  function formatDateTime(dt: string, tm?: string) {
    try {
      let dateObj;
      if (dt && tm) {
        // If dt is ISO and tm is time, combine
        const isoMatch = dt.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        if (isoMatch) {
          // If dt is ISO, ignore tm and use dt
          dateObj = new Date(dt);
        } else {
          dateObj = new Date(`${dt}T${tm}`);
        }
      } else {
        dateObj = new Date(dt);
      }
      if (!Number.isFinite(dateObj.getTime())) return dt + (tm ? ' ' + tm : '');
      const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      const hh = dateObj.getHours();
      const mm = dateObj.getMinutes();
      const suffix = hh >= 12 ? 'PM' : 'AM';
      const hour12 = ((hh + 11) % 12) + 1;
      return `${dateStr} ${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
    } catch {
      return dt + (tm ? ' ' + tm : '');
    }
  }

  useEffect(() => {
    (async () => {
      // Fetch global summary for dashboard cards
      const [q, g, p] = await Promise.all([
        questionsApi.list({ page: 1, limit: 3, sort: "-createdAt" }).catch(() => ({ items: [], total: 0 })),
        groupsApi.list({ page: 1, limit: 3, sort: "-createdAt" }).catch(() => ({ items: [], total: 0 })),
        peerApi.list({ page: 1, limit: 3, sort: "-createdAt" }).catch(() => ({ items: [], total: 0 })),
      ]);
      setQuestionsTotal(q.total || 0);
      setGroupsTotal(g.total || 0);
      setClassesTotal(p.total || 0);
      setQuestions(q.items.slice(0, 3));
      setGroups(g.items.slice(0, 3));
      setClasses(p.items.slice(0, 3));
      if (user) {
        // Fetch user's own questions by searching for their name, then filter by userId
        const myQRes = await questionsApi.list({ q: user.name, page: 1, limit: 10, sort: "-createdAt" }).catch(() => ({ items: [] }));
        setMyQuestions((myQRes.items || []).filter((it) => it.userId === user.userId).slice(0, 5));
        setMyGroups(g.items.filter((it) => it.creatorId === user.userId).slice(0, 5));
        setMyClasses(p.items.filter((it) => it.tutorId === user.userId).slice(0, 5));
        setJoinedGroups(g.items.filter((it) => Array.isArray(it.participants) && it.participants.includes(user.userId)).slice(0, 5));
        setJoinedClasses(p.items.filter((it) => Array.isArray(it.participants) && it.participants.includes(user.userId)).slice(0, 5));
        setAnsweredQuestions(q.items.filter((it) => Array.isArray(it.answers) && it.answers.some((a) => a.answeredBy === user.name)).slice(0, 5));
      }
    })();
  }, [user]);

  if (!user) return null;
  return (
    <PageContainer>
      <SectionHeader title="Dashboard" subtitle={`Welcome back, ${user.name}.`} />

      

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="font-medium mb-2">Quick Actions</div>
          <div className="mt-2 grid gap-2">
            <Link href="/dashboard/questions" className="block">
              <div className="w-full rounded-lg border border-token bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/15 transition-colors px-4 py-3 inline-flex items-center justify-center gap-2 text-center">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)]/20"><ChatBubbleLeftRightIcon className="h-4 w-4 text-[var(--color-secondary)]" /></span>
                <span className="font-medium">Ask in Q&A</span>
              </div>
            </Link>
            <Link href="/dashboard/groups" className="block">
              <div className="w-full rounded-lg border border-token bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 transition-colors px-4 py-3 inline-flex items-center justify-center gap-2 text-center">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/20"><UserGroupIcon className="h-4 w-4 text-[var(--color-primary)]" /></span>
                <span className="font-medium">Create Group</span>
              </div>
            </Link>
            <Link href="/dashboard/peer" className="block">
              <div className="w-full rounded-lg border border-token bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/15 transition-colors px-4 py-3 inline-flex items-center justify-center gap-2 text-center">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)]/20"><AcademicCapIcon className="h-4 w-4 text-[var(--color-secondary)]" /></span>
                <span className="font-medium">Offer Class</span>
              </div>
            </Link>
          </div>
        </Card>
        <Card>
          <div className="font-medium mb-2">Overview</div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <Link href="/dashboard/questions" className="rounded-lg border border-token bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 transition-colors px-4 py-5 flex flex-col items-center text-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--color-secondary)]" />
              <div className="mt-1 text-3xl font-semibold">{questionsTotal}</div>
              <div className="text-xs text-muted">Questions</div>
            </Link>
            <Link href="/dashboard/groups" className="rounded-lg border border-token bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors px-4 py-5 flex flex-col items-center text-center">
              <UserGroupIcon className="h-5 w-5 text-[var(--color-primary)]" />
              <div className="mt-1 text-3xl font-semibold">{groupsTotal}</div>
              <div className="text-xs text-muted">Groups</div>
            </Link>
            <Link href="/dashboard/peer" className="rounded-lg border border-token bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 transition-colors px-4 py-5 flex flex-col items-center text-center">
              <AcademicCapIcon className="h-5 w-5 text-[var(--color-secondary)]" />
              <div className="mt-1 text-3xl font-semibold">{classesTotal}</div>
              <div className="text-xs text-muted">Classes</div>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <div className="font-semibold text-lg mb-3">Recent Questions</div>
          <div className="space-y-3">
            {questions.map((q) => (
              <Link key={q.questionId} href={`/dashboard/questions/${q.questionId}`} className="block group">
                <div className="flex gap-4 p-3 rounded-lg bg-[var(--color-surface)] hover:shadow-md transition border border-token h-full">
                  <Avatar src={q.userAvatarUrl} alt={q.userName} size={36} />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-base truncate">{q.title}</div>
                      <div className="text-xs text-muted truncate">{q.description}</div>
                    </div>
                    <div className="text-[10px] text-muted mt-2 text-left">{formatDateTime(q.date)}</div>
                  </div>
                </div>
              </Link>
            ))}
            {questions.length === 0 && <div className="text-sm text-muted">No recent questions</div>}
          </div>
        </Card>
        <Card>
          <div className="font-semibold text-lg mb-3">Upcoming Groups</div>
          <div className="space-y-3">
            {groups.map((g) => (
              <Link key={g.groupId} prefetch href={`/dashboard/groups?open=${g.groupId}`} className="block group">
                <div className="flex gap-4 p-3 rounded-lg bg-[var(--color-surface)] hover:shadow-md transition border border-token h-full">
                  <Avatar src={g.participantsDetails?.find(p => p.userId === g.creatorId)?.avatarUrl} alt={g.participantsDetails?.find(p => p.userId === g.creatorId)?.name} size={36} />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-base truncate">{g.title}</div>
                      <div className="text-xs text-muted truncate">{g.description}</div>
                    </div>
                    <div className="text-[10px] text-muted mt-2 text-left">{formatDateTime(g.date, g.time)}</div>
                  </div>
                </div>
              </Link>
            ))}
            {groups.length === 0 && <div className="text-sm text-muted">No upcoming groups</div>}
          </div>
        </Card>
        <Card>
          <div className="font-semibold text-lg mb-3">Peer Classes</div>
          <div className="space-y-3">
            {classes.map((c) => (
              <Link prefetch key={c.classId} href={`/dashboard/peer?open=${c.classId}`} className="block group">
                <div className="flex gap-4 p-3 rounded-lg bg-[var(--color-surface)] hover:shadow-md transition border border-token h-full">
                  <Avatar src={c.creatorAvatarUrl || c.participantsDetails?.find(p => p.userId === c.creatorId)?.avatarUrl} alt={c.creatorName || c.participantsDetails?.find(p => p.userId === c.creatorId)?.name} size={36} />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="font-semibold text-base truncate">{c.title}</div>
                      <div className="text-xs text-muted truncate">{c.description}</div>
                    </div>
                    <div className="text-[10px] text-muted mt-2 text-left">{formatDateTime(c.date, c.time)}{typeof c.fee === 'number' ? ` • Rs.${c.fee}` : ''}</div>
                  </div>
                </div>
              </Link>
            ))}
            {classes.length === 0 && <div className="text-sm text-muted">No upcoming classes</div>}
          </div>
        </Card>
      </div>
      {/* Modal removed here: clicking upcoming group now routes to groups page with ?open=ID to show popup there */}

      <div className="mt-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-lg">My Activity</div>
          </div>
          <div className="mb-4 border-b border-token flex gap-2 overflow-x-auto">
            {(
              [
                { key: 'questions', label: 'Your Questions' },
                { key: 'groups', label: 'Your Groups' },
                { key: 'classes', label: 'Your Classes' },
                { key: 'joinedGroups', label: 'Joined Groups' },
                { key: 'joinedClasses', label: 'Joined Classes' },
                { key: 'answered', label: 'Answered' },
              ] as const
            ).map(t => (
              <button
                key={t.key}
                className={`py-2 px-4 text-sm font-medium rounded-t transition-colors ${activityTab === t.key ? 'bg-[var(--color-surface)] border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' : 'text-muted hover:text-[var(--color-primary)]'}`}
                onClick={() => setActivityTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 w-full max-w-full overflow-x-hidden">
            {(() => {
              const list = activityTab === 'questions' ? myQuestions
                : activityTab === 'groups' ? myGroups
                : activityTab === 'classes' ? myClasses
                : activityTab === 'joinedGroups' ? joinedGroups
                : activityTab === 'joinedClasses' ? joinedClasses
                : answeredQuestions;
              if (list.length === 0) {
                const emptyText = activityTab === 'questions' ? "You haven't asked any questions."
                  : activityTab === 'groups' ? "You haven't created any groups."
                  : activityTab === 'classes' ? "You haven't offered any classes."
                  : activityTab === 'joinedGroups' ? "You haven't joined any groups."
                  : activityTab === 'joinedClasses' ? "You haven't joined any classes."
                  : "You haven't answered any questions.";
                return <div className="text-sm text-muted py-6 text-center w-full">{emptyText}</div>;
              }
              return list.map((item: Question | GroupStudy | PeerClass) => {
                if ('questionId' in item) {
                  return (
                    <Link key={item.questionId} href={`/dashboard/questions/${item.questionId}`} className="flex gap-3 items-center rounded-lg border border-token bg-[var(--color-surface)] px-4 py-3 hover:shadow-md transition w-full max-w-full">
                      <Avatar src={item.userAvatarUrl} alt={item.userName} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">{item.title}</div>
                        <div className="text-xs text-muted truncate">{item.description}</div>
                        <div className="text-[10px] text-muted mt-2 text-left">{formatDateTime(item.date)}</div>
                      </div>
                    </Link>
                  );
                }
                if ('groupId' in item) {
                  return (
                    <Link prefetch key={item.groupId} href={`/dashboard/groups/${item.groupId}`} className="flex gap-3 items-center rounded-lg border border-token bg-[var(--color-surface)] px-4 py-3 hover:shadow-md transition w-full max-w-full">
                      <Avatar src={item.participantsDetails?.find(p => p.userId === item.creatorId)?.avatarUrl} alt={item.participantsDetails?.find(p => p.userId === item.creatorId)?.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">{item.title}</div>
                        <div className="text-xs text-muted truncate">{item.description}</div>
                        <div className="text-[10px] text-muted mt-2 text-left">{item.location} • {formatDateTime(item.date, item.time)}</div>
                      </div>
                    </Link>
                  );
                }
                if ('classId' in item) {
                  return (
                    <Link prefetch key={item.classId} href={`/dashboard/peer/${item.classId}`} className="flex gap-3 items-center rounded-lg border border-token bg-[var(--color-surface)] px-4 py-3 hover:shadow-md transition w-full max-w-full">
                      <Avatar src={item.creatorAvatarUrl || item.participantsDetails?.find(p => p.userId === item.creatorId)?.avatarUrl} alt={item.creatorName || item.participantsDetails?.find(p => p.userId === item.creatorId)?.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">{item.title}</div>
                        <div className="text-xs text-muted truncate">{item.description}</div>
                        <div className="text-[10px] text-muted mt-2 text-left">{formatDateTime(item.date, item.time)}</div>
                      </div>
                    </Link>
                  );
                }
                return null;
              });
            })()}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="font-medium mb-2">Upcoming Schedule</div>
          <Calendar
            events={[
              ...groups.map(g => ({ date: g.date, time: g.time, title: `Group: ${g.title}`, kind: 'group' as const, href: `/dashboard/groups/${g.groupId}` })),
              ...classes.map(c => ({ date: c.date, time: c.time, title: `Class: ${c.title}`, kind: 'class' as const, href: `/dashboard/peer/${c.classId}` })),
              ...joinedGroups.map(g => ({ date: g.date, time: g.time, title: `Group: ${g.title}`, kind: 'group' as const, href: `/dashboard/groups/${g.groupId}` })),
              ...joinedClasses.map(c => ({ date: c.date, time: c.time, title: `Class: ${c.title}`, kind: 'class' as const, href: `/dashboard/peer/${c.classId}` })),
            ]}
          />
        </Card>
      </div>

    </PageContainer>
  );
}


