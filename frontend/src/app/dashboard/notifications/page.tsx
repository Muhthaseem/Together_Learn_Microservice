"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { notificationsApi, type NotificationItem } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChatBubbleLeftRightIcon, UserGroupIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [onlyUnread, setOnlyUnread] = React.useState(false);

  const load = React.useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ page: p, limit: 20 });
      const filtered = onlyUnread ? { ...res, items: res.items.filter(n => !n.read) } : res;
      setItems(filtered.items);
      setPage(res.page);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  }, [onlyUnread]);

  React.useEffect(() => { load(1); }, [load]);

  async function markAll() {
    await notificationsApi.markAll();
    await load(page);
  }
  async function mark(id: string) {
    await notificationsApi.mark(id);
    await load(page);
  }

  function linkFor(n: NotificationItem): string | null {
    switch (n.type) {
      case 'question_answer':
        return n.data?.questionId ? `/dashboard/questions/${n.data.questionId}` : '/dashboard/questions';
      case 'group_join':
      case 'group_message':
        return n.data?.groupId ? `/dashboard/groups?open=${encodeURIComponent(n.data.groupId)}` : '/dashboard/groups';
      case 'class_join':
      case 'request_accept':
      case 'request_join':
        return '/dashboard/peer';
      case 'session_scheduled':
        return '/dashboard/peer';
      default:
        return null;
    }
  }

  function contextLabel(n: NotificationItem): string | null {
    if (!n?.data) return null;
    if (n.type === 'question_answer' && n.data.questionTitle) return `Question: ${String(n.data.questionTitle)}`;
    if ((n.type === 'group_join' || n.type === 'group_message') && n.data.groupTitle) return `Group: ${String(n.data.groupTitle)}`;
    if (n.type === 'class_join' && n.data.classTitle) return `Class: ${String(n.data.classTitle)}`;
    if ((n.type === 'request_accept' || n.type === 'request_join') && n.data.requestTitle) return `Request: ${String(n.data.requestTitle)}`;
    return null;
  }

  function renderTypeIcon(n: NotificationItem) {
    // Always render icon in a circle
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] border border-token shadow-sm">
        {n.type === 'question_answer' || n.type === 'group_message' ? (
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--color-secondary)]" />
        ) : n.type === 'group_join' ? (
          <UserGroupIcon className="h-5 w-5 text-[var(--color-primary)]" />
        ) : n.type === 'class_join' ? (
          <AcademicCapIcon className="h-5 w-5 text-[var(--color-secondary)]" />
        ) : n.type === 'request_accept' || n.type === 'request_join' ? (
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-[var(--color-success)]" />
        ) : n.type === 'session_scheduled' ? (
          <CalendarDaysIcon className="h-5 w-5 text-[var(--color-primary)]" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--color-secondary)]" />
        )}
      </span>
    );
  }

  // Group notifications by type, event, and body to avoid duplicates
  const unique: Record<string, NotificationItem> = {};
  items.forEach(n => {
    let key = n.type;
    if (n.type === 'question_answer' && n.data?.questionId) key += ':' + n.data.questionId;
    else if (n.type === 'group_join' && n.data?.groupId) key += ':' + n.data.groupId;
    else if (n.type === 'class_join' && n.data?.classId) key += ':' + n.data.classId;
    else if (n.type === 'group_message' && n.data?.groupId) key += ':' + n.data.groupId;
    else if (n.type === 'request_accept' && n.data?.requestId) key += ':' + n.data.requestId;
    else if (n.type === 'request_join' && n.data?.requestId) key += ':' + n.data.requestId;
    // Add body to key to avoid repeated identical notifications
    key += ':' + (n.body || '');
    if (!unique[key] || new Date(n.createdAt) > new Date(unique[key].createdAt)) unique[key] = n;
  });
  const filtered = Object.values(unique).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setOnlyUnread((v) => !v); setTimeout(() => load(1), 0); }}>{onlyUnread ? 'Show All' : 'Show Unread'}</Button>
          <Button onClick={markAll}>Mark all read</Button>
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <p className="text-sm">{onlyUnread ? 'No unread notifications' : 'No notifications yet'}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((n) => {
          const href = linkFor(n);
          // Remove contextLabel from notification card body
          return (
            <Card key={n.notificationId} className={`relative flex flex-col gap-2 ${n.read ? '' : 'border-[var(--color-secondary)]/40'} cursor-pointer shadow-md rounded-xl`} onClick={async () => { try { if (!n.read) await notificationsApi.mark(n.notificationId); } catch {} if (href) router.push(href); }}>
              <div className="flex gap-3">
                {renderTypeIcon(n)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.body}</p>
                </div>
              </div>
              {!n.read && (
                <div className="absolute inset-0 rounded-xl border-2 border-[var(--color-secondary)] pointer-events-none" />
              )}
            </Card>
          );
        })}
      </div>
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <Button key={pageNum} variant={page === pageNum ? undefined : 'outline'} onClick={() => { setPage(pageNum); load(pageNum); }} className="px-3 py-1 text-sm">
                {pageNum}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}


