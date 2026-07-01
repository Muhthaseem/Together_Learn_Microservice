"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CourseModule } from "@/lib/api";
import { groupsApi, coursesApi, usersApi, metaApi, filesApi, peerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ComboBox } from "@/components/ui/ComboBox";
import { Card, Badge } from "@/components/ui/Card";
import { PlusIcon, UserGroupIcon, BarsArrowDownIcon, ChatBubbleLeftRightIcon, PaperClipIcon, PaperAirplaneIcon, MicrophoneIcon, ArrowLeftIcon, DocumentArrowDownIcon, DocumentTextIcon } from "@heroicons/react/24/solid";
import { EmptyState } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  courseModule: z.string().min(1, "Select a course"),
  description: z.string().min(10, "Description is too short"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(2, "Location is too short"),
  mode: z.enum(["physical","virtual"]).default("physical"),
});

const AudioRecorderModal = dynamic(() => import("@/components/ui/AudioRecorderModal").then(m => m.default), { ssr: false });

export default function GroupsPage() {
  const { user } = useAuth();
  // If navigated with ?open=groupId from dashboard, auto-open details
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const openId = params.get('open');
    if (openId) {
      (async () => {
        const full = await groupsApi.get(openId).catch(() => null);
        if (full) setDetail(full as GroupDetail);
      })();
    }
  }, []);
  function formatTime12h(t: string): string {
    const [hh, mm] = (t || '').split(':');
    const hNum = Number(hh);
    const mNum = Number(mm);
    if (Number.isNaN(hNum) || Number.isNaN(mNum)) return t;
    const suffix = hNum >= 12 ? 'PM' : 'AM';
    const hour12 = ((hNum + 11) % 12) + 1;
    return `${hour12}:${String(mNum).padStart(2, '0')} ${suffix}`;
  }
  type GroupItem = {
    groupId: string; title: string; description: string; courseModule: string; location: string; date: string; time: string; participants: string[]; hosts?: string[]; mode?: 'virtual'|'physical';
    firstHostName?: string; firstHostAvatarUrl?: string; firstHostIndexNumber?: string; firstHostRegistrationNumber?: string;
    // Add peering class fields
    isPeeredClass?: boolean;
    peeredClassId?: string;
  };
  const [data, setData] = useState<{ items: GroupItem[]; page: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  type EnrichedUser = { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string };
  type GroupDetail = GroupItem & { description: string; creatorId: string; participantsDetails?: EnrichedUser[]; hostDetails?: EnrichedUser[] };
  const [detail, setDetail] = useState<null | GroupDetail>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ messageId: string; userId: string; userName?: string; userAvatarUrl?: string; text?: string; attachments?: string[]; createdAt: string }[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ id: string; file: File; url?: string; kind: 'image' | 'video' | 'audio' | 'doc'; name: string }[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [viewerUrl, setViewerUrl] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Change modal state to PeerClass | null
  const [peeredClassModal, setPeeredClassModal] = useState<null | import("@/lib/api").PeerClass>(null);

  type FormValues = z.infer<typeof schema>;
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    // zodResolver types cause inference friction with FieldValues in some setups
    // casting to Resolver<FormValues> avoids any without changing runtime behavior
    resolver: zodResolver(schema) as unknown as import('react-hook-form').Resolver<FormValues>,
    defaultValues: { mode: 'physical' } as Partial<FormValues>,
  });
  const courseModule = watch("courseModule");
  const mode = watch('mode');
  const [hostQuery, setHostQuery] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");
  type UserSearchResult = { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string };
  const [hostResults, setHostResults] = useState<UserSearchResult[]>([]);
  const [inviteResults, setInviteResults] = useState<UserSearchResult[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [hostLabels, setHostLabels] = useState<Record<string, string>>({});
  const [inviteLabels, setInviteLabels] = useState<Record<string, string>>({});
  const [batches, setBatches] = useState<string[]>([]);
  const [batchQuery, setBatchQuery] = useState("");
  const [allBatches, setAllBatches] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await coursesApi.list();
        const opts = all.map((m) => `${m.code} - ${m.title}`);
        setCourseOptions(opts);
        if (!courseModule && opts[0]) setValue("courseModule", opts[0]);
        if (!mode) setValue('mode', 'physical');
        // batches lookup
        const bs = await metaApi.batches().catch(()=>[] as string[]);
        setAllBatches(bs);
      } catch {}
    })();
  }, [courseModule, mode, setValue]);

  // Chat polling
  useEffect(() => {
    let timer: any;
    (async () => {
      if (chatOpen && detail) {
        const res = await groupsApi.messages.list(detail.groupId).catch(() => ({ items: [] as any[] }));
        setMessages(res.items);
        timer = setInterval(async () => {
          const r = await groupsApi.messages.list(detail.groupId).catch(() => ({ items: [] as any[] }));
          setMessages(r.items);
        }, 5000);
      }
    })();
    return () => { if (timer) clearInterval(timer); };
  }, [chatOpen, detail]);

  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatOpen, messages]);

  async function sendMessage() {
    if (!detail || sending) return;
    try {
      setSending(true);
      let attachments: string[] = [];
      const filesToUpload: File[] = [];
      if (pendingFiles.length) {
        pendingFiles.forEach(p => filesToUpload.push(p.file));
      }
      if (audioBlob) filesToUpload.push(new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
      if (filesToUpload.length) {
        const results = await Promise.all(filesToUpload.map(f => filesApi.upload(f)));
        attachments = results.map(r => r.url);
      }
      await groupsApi.messages.create(detail.groupId, { text: msgText.trim() || undefined, attachmentUrl: attachments.length ? attachments[0] : undefined });
      setMsgText("");
      if (fileRef.current) fileRef.current.value = "";
      // cleanup previews
      pendingFiles.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
      setPendingFiles([]);
      setAudioBlob(null);
      const r = await groupsApi.messages.list(detail.groupId).catch(() => ({ items: [] as any[] }));
      setMessages(r.items);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterCourse, search]);

  // Auto-refresh group list so creator sees new members and updated counts
  useEffect(() => {
    const t = setInterval(() => { load(); }, 15000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterCourse, search]);

  async function load() {
    const list = await groupsApi
      .list({ page, limit: 5, sort: '-createdAt', q: search || undefined, courseModule: filterCourse || undefined })
      .catch(() => null);
    if (list) {
      const uniqueItems = Array.from(new Map(list.items.map((it: GroupItem) => [it.groupId, it])).values());
      const getTs = (g: GroupItem) => {
        const d = new Date(g.date);
        if (g.time) {
          const [hh, mm] = String(g.time).split(':');
          const h = Number(hh); const m = Number(mm);
          if (!Number.isNaN(h) && !Number.isNaN(m)) d.setHours(h, m, 0, 0);
        }
        return d.getTime();
      };
      const sorted = [...uniqueItems].sort((a, b) => {
        const aJoined = user ? (Array.isArray(a.participants) && a.participants.includes(user.userId) ? 0 : 1) : 1;
        const bJoined = user ? (Array.isArray(b.participants) && b.participants.includes(user.userId) ? 0 : 1) : 1;
        if (aJoined !== bJoined) return aJoined - bJoined; // joined first
        return getTs(a) - getTs(b); // then nearest by date/time
      });
      setData({ ...list, items: sorted });
    }
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!user) return;
    try {
      await groupsApi.create({
        creatorId: user.userId,
        title: values.title,
        department: user.department,
        courseModule: values.courseModule,
        description: values.description,
        date: values.date,
        time: values.time,
        location: values.location,
        mode: values.mode || 'physical',
        hosts,
        invitees,
        batches,
      });
      toast.success("Group created");
      reset({ title: "", courseModule: values.courseModule, description: "", date: "", time: "", location: "" });
      setPage(1);
      await load();
    } catch (e) {
      toast.error("Failed to create group");
    }
  };

  async function join(id: string) {
    try {
      if (!user) return;
      await groupsApi.join(id, user.userId);
      toast.success("Joined group");
      await load();
    } catch (e) {
      toast.error("Failed to join group");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Group Study</h1>
        {/* Mobile toolbar */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="relative">
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Filters" onClick={() => setFiltersOpen(v => !v)}>
              <BarsArrowDownIcon className="h-5 w-5 text-muted" />
            </button>
            {filtersOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFiltersOpen(false)} />
                <div className="absolute left-0 mt-2 w-[22rem] max-w-[90vw] rounded-md surface border border-token shadow-xl z-50 p-3">
                  <div className="grid gap-3">
                    <div>
                      <div className="text-xs text-muted mb-1">Course Module</div>
                      <ComboBox className="max-w-full" options={courseOptions} value={filterCourse} onChange={setFilterCourse} onSearch={async (q) => {
                        const res = await coursesApi.search(q).catch(() => [] as CourseModule[]);
                        setCourseOptions((res as CourseModule[]).map((m) => `${m.code} - ${m.title}`));
                      }} placeholder="Search course..." />
                    </div>
                    <div>
                      <div className="text-xs text-muted mb-1">Search</div>
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, description, location" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>Create Group</Button>
        </div>
        {/* Desktop filters */}
        <div className="mt-3 hidden sm:flex items-center gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Course Module</label>
            <ComboBox className="max-w-xs" options={courseOptions} value={filterCourse} onChange={setFilterCourse} onSearch={async (q) => {
              const res = await coursesApi.search(q).catch(() => [] as CourseModule[]);
              setCourseOptions((res as CourseModule[]).map((m) => `${m.code} - ${m.title}`));
            }} placeholder="Search course..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, description, location" />
          </div>
          <Button className="ml-auto" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>Create Group</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.items.length === 0 && (
          <EmptyState
            title="No group studies yet"
            description="Create a group to study together."
            icon={<UserGroupIcon className="h-6 w-6 text-[var(--color-secondary)]" />}
          />
        )}
        {data?.items.map((g) => (
          <Card key={g.groupId} onClick={async()=>{ const full = await groupsApi.get(g.groupId).catch(()=>null); if(full) setDetail(full as GroupDetail); }} className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="font-medium inline-flex items-center gap-2">
                {g.title}
                {g.isPeeredClass && g.peeredClassId && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs cursor-pointer" onClick={async (e) => {
                    e.stopPropagation();
                    if (g.peeredClassId) {
                      const details = await peerApi.get(g.peeredClassId).catch(() => null);
                      if (details) setPeeredClassModal(details);
                    }
                  }}>Peering Class</span>
                )}
              </div>
              <Badge>{g.courseModule}</Badge>
            </div>
            {g.firstHostName && (
              <div className="mt-1 text-xs text-muted">
                <span className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1 bg-surface">
                  {g.firstHostAvatarUrl ? <Avatar src={g.firstHostAvatarUrl} alt={g.firstHostName} size={20} /> : <Avatar alt={g.firstHostName} size={20} />}
                  <span className="font-medium">{g.firstHostName}</span>
                  {(g.firstHostIndexNumber || g.firstHostRegistrationNumber) && <span className="text-[10px] text-muted">{g.firstHostIndexNumber || g.firstHostRegistrationNumber}</span>}
                </span>
              </div>
            )}
            <div className="text-sm mt-1">{g.description}</div>
            <div className="mt-1 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted">
                {g.location} • {new Date(g.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })} {formatTime12h(g.time)}
              </div>
              {user && g.participants?.includes(user.userId) ? (
                <Button variant="outline" className="ml-auto" onClick={async(e)=>{ e.stopPropagation(); try { await groupsApi.unjoin(g.groupId, user.userId); toast.success('Unjoined'); await load(); } catch { toast.error('Failed'); } }}>Unjoin</Button>
              ) : (
                <Button className="ml-auto" onClick={(e) => { e.stopPropagation(); join(g.groupId); }}>Join</Button>
              )}
            </div>
            <div className="text-xs text-muted mt-1">
              {g.mode === 'virtual' ? 'Virtual' : 'Physical'} • {g.participants?.length || 0} attendees • Hosts: {(g.hosts || []).length}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Prev</Button>
        <div className="text-sm">Page {data?.page || 1} {data ? `of ${data.pages}` : ''}</div>
        <Button variant="outline" disabled={!!data && page >= (data.pages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>

      <Modal open={!!detail} onClose={() => { setDetail(null); setChatOpen(false); }} title="Group details" panelClassName="max-w-3xl w-full">
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{detail.title}</div>
              {(user && (detail.creatorId === user.userId || (detail.hosts||[]).includes(user.userId) || (detail.participants||[]).includes(user.userId))) && (
                <button className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Open chat" onClick={async()=>{ if (!(user && (detail.creatorId === user.userId || (detail.hosts||[]).includes(user.userId) || (detail.participants||[]).includes(user.userId)))) return; const r = await groupsApi.messages.list(detail.groupId).catch(()=> ({ items: [] as any[] })); setMessages(r.items); setChatOpen(true); }}>
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-muted" />
                </button>
              )}
            </div>
            {!chatOpen && (
              <>
                <div className="text-muted">{detail.courseModule} • {detail.mode==='virtual'?'Virtual':'Physical'}</div>
                <div className="whitespace-pre-wrap">{detail.description}</div>
                <div>{detail.location} • {new Date(detail.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })} {formatTime12h(detail.time)}</div>
              </>
            )}
            {chatOpen && (
              <div className="border border-token rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-token bg-surface-2">
                  <button className="p-1 rounded hover:bg-[var(--color-accent)]/10" onClick={()=> setChatOpen(false)}><ArrowLeftIcon className="h-4 w-4" /></button>
                  <div className="font-medium text-sm">Group chat</div>
                </div>
                <div className="max-h-[60vh] overflow-auto p-3 space-y-2 bg-surface">
                  {messages.length === 0 && <div className="text-xs text-muted">No messages yet</div>}
                  {messages.map(m => {
                    const isMine = m.userId===user?.userId;
                    const bubbleBase = `inline-block max-w-full rounded-2xl px-3 py-2 ${isMine ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] text-right' : 'border border-token bg-surface'}`;
                    return (
                    <div key={m.messageId} className={`max-w-[85%] ${isMine ? 'ml-auto text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                        {m.userAvatarUrl ? <Avatar src={m.userAvatarUrl} alt={m.userName || 'User'} size={24} /> : <Avatar alt={m.userName || 'User'} size={24} />}
                        <div className="text-xs text-muted">{m.userName || (isMine ? 'You' : 'User')}</div>
                      </div>
                      <div className={bubbleBase}>
                        {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
                        {m.attachments && m.attachments.length>0 && (
                        <div className={`mt-2 grid grid-cols-2 gap-2 ${isMine ? 'justify-items-end justify-end inline-grid ml-auto' : ''}`}>
                          {m.attachments.map((url, i) => {
                            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(url);
                            const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                            const isAudio = /\.(mp3|wav|m4a|aac|oga)$/i.test(url);
                            const isDoc = !isImage && !isVideo && !isAudio; // docs should download via proxy
                            const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
                            const open = () => {
                              const finalUrl = isDoc ? `${API_BASE}/uploads/proxy?url=${encodeURIComponent(url)}` : url;
                              window.open(finalUrl, '_blank', 'noopener');
                            };
                            return (
                                <div key={i} className="rounded border border-token overflow-hidden bg-surface">
                                  {isImage ? (
                                    <button type="button" onClick={()=> { setViewerType('image'); setViewerUrl(url); setViewerOpen(true); }}><img src={url} className="w-28 h-28 object-cover" alt="attachment" /></button>
                                  ) : isVideo ? (
                                    <button type="button" onClick={()=> { setViewerType('video'); setViewerUrl(url); setViewerOpen(true); }}><img src={url + '#thumb'} className="w-28 h-28 object-cover" alt="video" /></button>
                                  ) : isAudio ? (
                                    <button type="button" onClick={()=> { setViewerType('audio'); setViewerUrl(url); setViewerOpen(true); }} className="w-28 h-16 text-xs text-muted">Preview audio</button>
                                  ) : (
                                    <button type="button" onClick={open} className="w-28 h-16 flex items-center justify-center text-xs text-muted">Download</button>
                                  )}
                                </div>
                            );
                          })}
                        </div>
                        )}
                      </div>
                      <div className="text-[10px] text-muted mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    );
                  })}
                </div>
                <div className="p-2 flex items-center gap-2 border-t border-token bg-surface-2">
                  <button className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Attach files" onClick={()=> fileRef.current?.click()}><PaperClipIcon className="h-4 w-4" /></button>
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={(e)=>{
                    const files = Array.from(e.target.files || []);
                    const next = files.map((f, idx) => {
                      const lower = f.name.toLowerCase();
                      const isImage = /\.(png|jpe?g|gif|webp)$/i.test(lower);
                      const isVideo = /\.(mp4|webm|ogg)$/i.test(lower);
                      const isAudio = /\.(mp3|wav|m4a|aac|oga)$/i.test(lower);
                      const kind = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'doc';
                      const url = (isImage || isVideo || isAudio) ? URL.createObjectURL(f) : undefined;
                      return { id: `${Date.now()}-${idx}`, file: f, url, kind, name: f.name } as const;
                    });
                    setPendingFiles(prev => [...prev, ...next]);
                  }} />
                  <button className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Record voice" onClick={()=> setRecOpen(true)}><MicrophoneIcon className="h-4 w-4" /></button>
                  <input className="flex-1 rounded border border-token px-2 py-2 bg-surface" placeholder="Write a message" value={msgText} onChange={(e)=> setMsgText(e.target.value)} onKeyDown={(e)=> { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
                  <button disabled={sending || (!msgText.trim() && !(fileRef.current && fileRef.current.files && fileRef.current.files.length) && !audioBlob)} className="p-2 rounded bg-[var(--color-primary)] text-[var(--color-on-primary)] disabled:opacity-50" onClick={sendMessage} title="Send">
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
                {pendingFiles.length>0 && (
                  <div className="p-2 border-t border-token bg-surface-2">
                    <div className="text-xs text-muted mb-1">Attachments ({pendingFiles.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {pendingFiles.map(p => (
                        <div key={p.id} className="relative rounded border border-token overflow-hidden">
                          {(p.kind==='image' || p.kind==='video' || p.kind==='audio') ? (
                            p.kind==='image' ? <img src={p.url} className="w-24 h-24 object-cover" alt={p.name} /> : p.kind==='video' ? <video src={p.url} className="w-24 h-24 object-cover" controls /> : <audio src={p.url} className="w-24" controls />
                          ) : (
                            <div className="w-24 h-24 flex items-center justify-center text-xs text-muted px-1 text-center">
                              <DocumentTextIcon className="h-6 w-6 mr-1" /> Document
                            </div>
                          )}
                          <button type="button" className="absolute top-1 right-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full w-5 h-5 text-xs flex items-center justify-center shadow" aria-label="Remove" title="Remove" onClick={()=> setPendingFiles(prev => prev.filter(x => x.id !== p.id))}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!chatOpen && <div>
              <div className="text-xs text-muted mb-1">Hosts</div>
              <div className="flex flex-wrap gap-2">
                {(detail.hostDetails||[]).map(u => (
                  <span key={u.userId} className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1">
                    {u.avatarUrl ? <Avatar src={u.avatarUrl} alt={u.name} size={20} /> : <Avatar alt={u.name} size={20} />}
                    <span className="flex flex-col leading-tight">
                      <span>{u.name}</span>
                      {(u.indexNumber || u.registrationNumber) && <span className="text-[10px] text-muted">{u.indexNumber || u.registrationNumber}</span>}
                    </span>
                  </span>
                ))}
              </div>
            </div>}
            {!chatOpen && <div>
              <div className="text-xs text-muted mb-1">Attendees ({detail.participantsDetails?.length||0})</div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-auto pr-1">
                {(detail.participantsDetails||[]).map(u => (
                  <span key={u.userId} className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1">
                    {u.avatarUrl ? <Avatar src={u.avatarUrl} alt={u.name} size={20} /> : <Avatar alt={u.name} size={20} />}
                    <span className="flex flex-col leading-tight">
                      <span>{u.name}</span>
                      {(u.indexNumber || u.registrationNumber) && <span className="text-[10px] text-muted">{u.indexNumber || u.registrationNumber}</span>}
                    </span>
                  </span>
                ))}
              </div>
            </div>}
            <div className="pt-1 flex justify-between items-center">
              {user && user.userId === detail.creatorId && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={async()=>{
                    // Simple inline edit: reuse Create modal structure could be added later; for now just reopen Create prefilled
                    setOpen(true);
                    setDetail(null);
                    setValue('title', detail.title);
                    setValue('courseModule', detail.courseModule);
                    setValue('description', detail.description);
                    setValue('date', detail.date);
                    setValue('time', detail.time);
                    setValue('location', detail.location);
                    setValue('mode', (detail.mode || 'physical') as any);
                  }}>Edit</Button>
                  <Button variant="outline" onClick={()=> setDeleteOpen(true)}>Delete</Button>
                </div>
              )}
              {user && detail.participants?.includes(user.userId) ? (
                <Button variant="outline" onClick={async()=>{ await groupsApi.unjoin(detail.groupId, user.userId); toast.success('Unjoined'); setDetail(null); await load(); }}>Unjoin</Button>
              ) : (
                <Button onClick={async()=>{ if(!user) return; await groupsApi.join(detail.groupId, user.userId); toast.success('Joined'); setDetail(null); await load(); }}>Join</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
      <AudioRecorderModal open={recOpen} onClose={()=> setRecOpen(false)} onSave={(b)=> { setAudioBlob(b); setRecOpen(false); }} />

      {/* Media viewer */}
      <Modal open={viewerOpen} onClose={()=> setViewerOpen(false)} title="Preview" panelClassName="max-w-3xl w-full">
        {viewerType === 'image' && (
          <div className="p-2"><img src={viewerUrl} className="max-h-[70vh] w-auto mx-auto" alt="preview" /></div>
        )}
        {viewerType === 'video' && (
          <div className="p-2"><video src={viewerUrl} controls className="w-full max-h-[70vh]" /></div>
        )}
        {viewerType === 'audio' && (
          <div className="p-6 flex items-center justify-center"><audio src={viewerUrl} controls /></div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete group?">
        <div className="text-sm">This action cannot be undone.</div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={async()=>{ if(!detail) return; await groupsApi.remove(detail.groupId); toast.success('Deleted'); setDeleteOpen(false); setDetail(null); await load(); }}>Delete</Button>
        </div>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Create a group">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input {...register("title")} placeholder="Title" />
          </div>
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Course Module</label>
            <ComboBox options={courseOptions} value={courseModule || ""} onChange={(v) => setValue("courseModule", v)} onSearch={async (q) => {
              const res = await coursesApi.search(q).catch(() => [] as CourseModule[]);
              setCourseOptions((res as CourseModule[]).map((m) => `${m.code} - ${m.title}`));
            }} placeholder="Search course..." />
          </div>
          {errors.courseModule && <p className="text-sm text-red-600">{errors.courseModule.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea {...register("description")} placeholder="Description" />
          </div>
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          {/* Mode selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Mode</label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm"><input type="radio" value="physical" {...register('mode')} defaultChecked /><span>Physical</span></label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="radio" value="virtual" {...register('mode')} /><span>Virtual</span></label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input type="date" {...register("date")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <Input type="time" {...register("time")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{mode === 'virtual' ? 'Meeting Link' : 'Location'}</label>
              <Input placeholder={mode === 'virtual' ? 'Meeting link (e.g., Zoom/Meet url)' : 'Location'} {...register("location")} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium mb-1">Add Host</label>
              <div className="relative">
                <Input value={hostQuery} onChange={async (e: React.ChangeEvent<HTMLInputElement>)=>{ const q=e.target.value; setHostQuery(q); if(q.trim()){ const res=await usersApi.search(q).catch(()=>[] as UserSearchResult[]); setHostResults(res as UserSearchResult[]);} else { setHostResults([]);} }} placeholder="Search hosts..." />
                {hostResults.length>0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md surface border border-token shadow-xl max-h-60 overflow-auto">
                {hostResults.map(u=> (
                      <button type="button" key={u.userId} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-accent)]/10" onClick={()=>{ setHosts(prev=> prev.includes(u.userId)? prev : [...prev,u.userId]); setHostLabels(prev => ({ ...prev, [u.userId]: u.name })); setHostQuery(""); setHostResults([]); }}>
                    {u.avatarUrl ? <Avatar src={u.avatarUrl} alt={u.name} size={20} /> : <Avatar alt={u.name} size={20} />}
                        <span className="text-sm">{u.name} <span className="text-[var(--color-muted)]">{u.registrationNumber || u.indexNumber}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {hosts.length>0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {hosts.map(id => (<span key={id} className="text-xs rounded-full border border-token px-2 py-0.5">{hostLabels[id] || id} <button type="button" onClick={()=> setHosts(prev=> prev.filter(x=>x!==id))}>×</button></span>))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Add Attendees</label>
            <div className="relative">
                <Input value={inviteQuery} onChange={async (e: React.ChangeEvent<HTMLInputElement>)=>{ const q=e.target.value; setInviteQuery(q); if(q.trim()){ const res=await usersApi.search(q).catch(()=>[] as UserSearchResult[]); setInviteResults(res as UserSearchResult[]);} else { setInviteResults([]);} }} placeholder="Search attendees..." />
              {inviteResults.length>0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md surface border border-token shadow-xl max-h-60 overflow-auto">
                {inviteResults.map(u=> (
                    <button type="button" key={u.userId} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-accent)]/10" onClick={()=>{ setInvitees(prev=> prev.includes(u.userId)? prev : [...prev,u.userId]); setInviteLabels(prev => ({ ...prev, [u.userId]: u.name })); setInviteQuery(""); setInviteResults([]); }}>
                    {u.avatarUrl ? <Avatar src={u.avatarUrl} alt={u.name} size={20} /> : <Avatar alt={u.name} size={20} />}
                      <span className="text-sm">{u.name} <span className="text-[var(--color-muted)]">{u.registrationNumber || u.indexNumber}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {invitees.length>0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {invitees.map(id => (<span key={id} className="text-xs rounded-full border border-token px-2 py-0.5">{inviteLabels[id] || id} <button type="button" onClick={()=> setInvitees(prev=> prev.filter(x=>x!==id))}>×</button></span>))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Add batches</label>
            <div className="relative">
              <Input value={batchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{ const q=e.target.value; setBatchQuery(q); if(q.trim()){ const res = allBatches.filter(b=> b.toLowerCase().includes(q.toLowerCase())); setBatchResults(res);} else { setBatchResults([]);} }} placeholder="Search batches..." />
              {batchResults.length>0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md surface border border-token shadow-xl max-h-60 overflow-auto">
                  {batchResults.map(b => (
                    <button type="button" key={b} className="w-full px-3 py-2 text-left hover:bg-[var(--color-accent)]/10" onClick={()=>{ setBatches(prev=> prev.includes(b) ? prev : [...prev,b]); setBatchQuery(""); setBatchResults([]); }}>
                      <span className="text-sm">{b}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {batches.length>0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {batches.map(b => (<span key={b} className="text-xs rounded-full border border-token px-2 py-0.5">{b} <button type="button" onClick={()=> setBatches(prev=> prev.filter(x=>x!==b))}>×</button></span>))}
              </div>
            )}
            <div className="text-xs text-muted mt-1">All users in selected batches will be added as attendees.</div>
          </div>
          {(errors.date || errors.time || errors.location) && (
            <p className="text-sm text-red-600">{errors.date?.message || errors.time?.message || errors.location?.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Peered class modal */}
      {peeredClassModal && (
        <Modal open={true} onClose={() => setPeeredClassModal(null)} title="Peered Class Details">
          {peeredClassModal && (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-lg">{peeredClassModal.title}</div>
              <div>{peeredClassModal.description}</div>
              <div>Course: {peeredClassModal.courseModule}</div>
              <div>Date: {peeredClassModal.date ? new Date(peeredClassModal.date).toLocaleDateString() : ''} {peeredClassModal.time}</div>
              <div>Location: {peeredClassModal.location}</div>
              <div>Mode: {peeredClassModal.mode}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}


