"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { questionsApi, type Question, uploadApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { PencilSquareIcon, TrashIcon, BookmarkIcon, XMarkIcon, SpeakerWaveIcon, EllipsisVerticalIcon, DocumentTextIcon, PhotoIcon, VideoCameraIcon, PaperClipIcon, MicrophoneIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal";
const AudioRecorderModal = dynamic(() => import("@/components/ui/AudioRecorderModal").then(m => m.default), { ssr: false });

const schema = z.object({ text: z.string().min(1, "Answer is required") });

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { user } = useAuth();
  const [q, setQ] = useState<Question | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const [files, setFiles] = useState<File[]>([]);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const imgRef = useRef<HTMLInputElement | null>(null);
  const vidRef = useRef<HTMLInputElement | null>(null);
  const docRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<{ url: string; kind: 'image' | 'video' | 'audio' | 'doc'; name?: string; ext?: string }[]>([]);
  const [answerModal, setAnswerModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [viewerMeta, setViewerMeta] = useState<{ by: string; date: string } | null>(null);
  const [editAnswer, setEditAnswer] = useState<{ id: string; text: string; attachments: string[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const [editQuestion, setEditQuestion] = useState<{ open: boolean; title: string; description: string; attachments: string[] }>({ open: false, title: '', description: '', attachments: [] });
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState(false);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  const editImgRef = useRef<HTMLInputElement | null>(null);
  const editVidRef = useRef<HTMLInputElement | null>(null);
  const editDocRef = useRef<HTMLInputElement | null>(null);
  const [newEditFiles, setNewEditFiles] = useState<File[]>([]);
  const [editPreviews, setEditPreviews] = useState<{ url: string; kind: 'image' | 'video' | 'audio' | 'doc' }[]>([]);
  const [qMenuOpen, setQMenuOpen] = useState(false);
  const [answerMenuOpenId, setAnswerMenuOpenId] = useState<string | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editRecOpen, setEditRecOpen] = useState(false);
  const [editAudio, setEditAudio] = useState<Blob | null>(null);
  const [savingEditAnswer, setSavingEditAnswer] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState(false);
  const [deletingAnswer, setDeletingAnswer] = useState(false);
  useEffect(() => {
    const p: { url: string; kind: 'image' | 'video' | 'audio' | 'doc' }[] = [];
    newEditFiles.forEach(f => p.push({ url: URL.createObjectURL(f), kind: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'doc' }));
    setEditPreviews(p);
    return () => p.forEach(x => URL.revokeObjectURL(x.url));
  }, [newEditFiles]);
  useEffect(() => {
    const p: { url: string; kind: 'image' | 'video' | 'audio' | 'doc'; name?: string; ext?: string }[] = [];
    files.forEach(f => {
      const name = f.name || '';
      const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = (extMatch?.[1] || '').toLowerCase();
      p.push({ url: URL.createObjectURL(f), kind: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'doc', name, ext });
    });
    setPreviews(p);
    return () => p.forEach(x => URL.revokeObjectURL(x.url));
  }, [files]);

  function getDocLabel(ext?: string) {
    switch ((ext || '').toLowerCase()) {
      case 'pdf': return 'PDF';
      case 'doc':
      case 'docx': return 'Word';
      case 'xls':
      case 'xlsx': return 'Excel';
      case 'ppt':
      case 'pptx': return 'PowerPoint';
      case 'csv': return 'CSV';
      case 'txt': return 'TXT';
      default: return 'Document';
    }
  }
  useEffect(() => {
    function handleClick() {
      setQMenuOpen(false);
      setAnswerMenuOpenId(null);
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!id) return;
    load();
    const interval = setInterval(load, 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      const data = await questionsApi.get(id);
      setQ(data);
    } catch {
      toast.error("Failed to load question");
    }
  }

  function downloadDocument(url: string) {
    // Use backend proxy to avoid Cloudinary 401/invalid-response quirks and force Content-Disposition
    const api = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
    const proxy = `${api}/uploads/proxy?url=${encodeURIComponent(url)}`;
    const a = document.createElement('a');
    a.href = proxy;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return;
    try {
      const attachments: string[] = [];
      if (files.length) {
        const up = await uploadApi.upload(files);
        attachments.push(...up.files.map(f => f.url));
      }
      if (audio) {
        const file = new File([audio], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        const up = await uploadApi.upload([file]);
        attachments.push(...up.files.map(f => f.url));
      }
      await questionsApi.addAnswer(id, { answeredById: user.userId, authorName: user.name, text: values.text, attachments } as any);
      toast.success("Answer posted");
      reset({ text: "" });
      setFiles([]);
      setAudio(null);
      await load();
    } catch {
      toast.error("Failed to post answer");
    }
  };

  if (!q) return null;
  const isOwner = user?.userId === q.userId;

  return (
    <div className="max-w-6xl mx-auto md:grid md:grid-cols-2 gap-4">
      <div className="md:sticky md:top-20 self-start">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[var(--color-accent)]/10 blur-2xl"></div>
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="mb-1"><Badge>{q.courseModule}</Badge></div>
            <h1 className="text-2xl font-semibold tracking-tight leading-snug">{q.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button className="p-1 rounded hover:bg-[var(--color-accent)]/10" onClick={() => setQMenuOpen(v => !v)}>
                  <EllipsisVerticalIcon className="h-5 w-5 text-muted" />
                </button>
                {qMenuOpen && (
                  <div className="absolute right-0 mt-2 w-36 rounded-md bg-white dark:bg-[var(--color-surface)] shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50">
                    <button className="block w-full px-3 py-2 text-left hover:bg-[var(--color-accent)]/10 text-sm" onClick={() => { setQMenuOpen(false); setEditQuestion({ open: true, title: q.title, description: q.description, attachments: q.attachments || [] }); }}>Edit</button>
                    <button className="block w-full px-3 py-2 text-left hover:bg-red-500/10 text-sm text-red-600" onClick={() => { setQMenuOpen(false); setConfirmDeleteQuestion(true); }}>Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* owner action buttons removed as requested */}
        <p className="mt-3 text-sm">{q.description}</p>
        <div className="mt-3 border-t border-token"></div>
        {Array.isArray(q.attachments) && q.attachments.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {q.attachments.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const isImage = url.match(/\.(png|jpe?g|gif|webp)$/i);
                  const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                  const isAudio = url.match(/\.(mp3|wav|m4a|aac|oga)$/i);
                  const isDoc = url.includes('/raw/upload/') || url.match(/\.(pdf|docx?|pptx?|xlsx?|txt|csv|rtf)$/i);
                  if (isDoc) { setViewerOpen(false); setViewerUrl(null); setViewerMeta(null); downloadDocument(url); return; }
                  setViewerUrl(url);
                  setViewerType(isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'image');
                  setViewerMeta({ by: q.userName, date: String(q.date) });
                  setViewerOpen(true);
                }}
                className="group relative rounded-lg border border-token overflow-hidden text-left shadow-sm hover:shadow transition"
              >
                {url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                  <img src={url} className="w-full h-24 object-cover transition-transform duration-200 group-hover:scale-105" />
                ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={url} className="w-full h-24 object-cover" />
                ) : url.match(/\.(mp3|wav|m4a|aac|oga)$/i) ? (
                  <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                      <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                    </span>
                    <span className="text-muted">Audio</span>
                  </div>
                ) : (
                  <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                      <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                    </span>
                    <span className="text-muted">Document</span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">View</div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted flex items-center gap-2">
            {(q as any).userAvatarUrl ? (
              <img src={(q as any).userAvatarUrl} className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-secondary)]"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor"/></svg>
              </span>
            )}
            <span>by {q.userName} · {new Date(q.date).toLocaleString()}</span>
          </div>
          <Button onClick={() => setAnswerModal(true)} className="bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-md">Add Answer</Button>
        </div>
      </Card>
      </div>

      {/* Right column: answers list */}
      <div className="md:max-h-[calc(100vh-140px)] md:overflow-y-auto pr-1">
      <div className="space-y-3 mt-4">
        {q.answers.length === 0 && <div className="text-sm text-muted">No answers yet.</div>}
        {q.answers
          .slice()
          .sort((a: any,b: any)=> {
            const pins = (q as any).pinnedAnswerIds || [];
            const aPinned = pins.includes((a as any).answerId);
            const bPinned = pins.includes((b as any).answerId);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return new Date(b.date as any).getTime()-new Date(a.date as any).getTime();
          })
          .map((a) => (
          <Card key={a.answerId} className="relative">
            {((((q as any).pinnedAnswerIds || []).includes(a.answerId)) || isOwner || (a.answeredBy === user?.name)) && (
              <div className="absolute top-2 right-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {((q as any).pinnedAnswerIds || []).includes(a.answerId) && <span className="text-xs rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] px-2 py-0.5">Pinned</span>}
                {(isOwner || a.answeredBy === user?.name) && (
                  <div className="relative">
                    <button className="p-1 rounded hover:bg-[var(--color-accent)]/10" onClick={() => setAnswerMenuOpenId(prev => prev === a.answerId ? null : a.answerId)}>
                      <EllipsisVerticalIcon className="h-5 w-5 text-muted" />
                    </button>
                    {answerMenuOpenId === a.answerId && (
                      <div className="absolute right-0 mt-2 w-36 rounded-md bg-white dark:bg-[var(--color-surface)] shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50">
                        {/* Owner can pin; author cannot pin unless also owner */}
                        {isOwner && (
                          <button
                            className="block w-full px-3 py-2 text-left hover:bg-[var(--color-accent)]/10 text-sm"
                            onClick={async () => {
                              setAnswerMenuOpenId(null);
                              try {
                                const currentlyPinned = ((q as any).pinnedAnswerIds || []).includes(a.answerId);
                                // optimistic toggle
                                setQ(prev => {
                                  if (!prev) return prev as any;
                                  const current = new Set(prev.pinnedAnswerIds || []);
                                  if (currentlyPinned) current.delete(a.answerId); else current.add(a.answerId);
                                  return { ...(prev as any), pinnedAnswerIds: Array.from(current) } as any;
                                });
                                const res = await questionsApi.pinAnswer(q.questionId, a.answerId);
                                toast.success(currentlyPinned ? 'Unpinned' : 'Pinned');
                                await load();
                              } catch (e: any) {
                                toast.error(e.message);
                              }
                            }}
                          >
                            {(((q as any).pinnedAnswerIds || []).includes(a.answerId)) ? 'Unpin' : 'Pin'}
                          </button>
                        )}
                        {(a.answeredBy === user?.name) && (
                          <button className="block w-full px-3 py-2 text-left hover:bg-[var(--color-accent)]/10 text-sm" onClick={() => { setAnswerMenuOpenId(null); setEditAnswer({ id: a.answerId, text: a.text, attachments: (a as any).attachments || [] }); setNewEditFiles([]); }}>
                            Edit
                          </button>
                        )}
                        {(isOwner || a.answeredBy === user?.name) && (
                          <button className="block w-full px-3 py-2 text-left hover:bg-red-500/10 text-sm text-red-600" onClick={() => { setAnswerMenuOpenId(null); setConfirmDelete({ id: a.answerId }); }}>
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <p className="mt-2 text-sm">{a.text}</p>
            {Array.isArray((a as any).attachments) && (a as any).attachments.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(a as any).attachments.map((url: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const isImage = url.match(/\.(png|jpe?g|gif|webp)$/i);
                      const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                      const isAudio = url.match(/\.(mp3|wav|m4a|aac|oga)$/i);
                      const isDoc = url.includes('/raw/upload/') || url.match(/\.(pdf|docx?|pptx?|xlsx?|txt|csv|rtf)$/i);
                      if (isDoc) { setViewerOpen(false); setViewerUrl(null); setViewerMeta(null); downloadDocument(url); return; }
                      setViewerUrl(url);
                      setViewerType(isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'image');
                      setViewerMeta({ by: a.answeredBy as any, date: String((a as any).date) });
                      setViewerOpen(true);
                    }}
                    className="rounded border border-token overflow-hidden text-left"
                  >
                    {url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                      <img src={url} className="w-full h-24 object-cover" />
                    ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={url} className="w-full h-24 object-cover" controls />
                    ) : url.match(/\.(mp3|wav|m4a|aac|oga)$/i) ? (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                          <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                        </span>
                        <span className="text-muted">Audio</span>
                      </div>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                          <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                        </span>
                        <span className="text-muted">{url.match(/\.pdf$/i) ? 'PDF' : url.match(/\.docx?$/i) ? 'Word' : url.match(/\.xlsx?$/i) ? 'Excel' : url.match(/\.pptx?$/i) ? 'PowerPoint' : url.match(/\.csv$/i) ? 'CSV' : url.match(/\.txt$/i) ? 'TXT' : 'Document'}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 text-xs text-muted flex items-center justify-between">
              <span className="flex items-center gap-2">
                {(a as any).answeredByAvatarUrl ? (
                  <img src={(a as any).answeredByAvatarUrl} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-secondary)]"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor"/></svg>
                  </span>
                )}
                <span>by {a.answeredBy} · {new Date((a as any).date).toLocaleString()}</span>
              </span>
              <button className="p-1 rounded hover:bg-[var(--color-accent)]/10" title="Reply" onClick={(e) => { e.stopPropagation(); (document.getElementById(`reply-toggle-${a.answerId}`) as HTMLButtonElement)?.click(); }}>
                <ChatBubbleLeftIcon className="h-5 w-5 text-muted" />
              </button>
            </div>

            {/* Replies and reply toggle */}
            <ReplySection
              questionId={q.questionId}
              ownerUserId={q.userId}
              answer={a}
              currentUserName={user?.name || ''}
              onReload={load}
              onOpenDoc={(url) => downloadDocument(url)}
              onOpenMedia={(url, type, by, date) => { setViewerUrl(url); setViewerType(type); setViewerMeta({ by, date }); setViewerOpen(true); }}
            />
          </Card>
        ))}
      </div>
      </div>

      {/* Answer Modal */}
      <Modal open={answerModal} onClose={() => setAnswerModal(false)} title="Your Answer">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Textarea {...register("text")} placeholder="Write your answer" />
          {errors.text && <p className="text-sm text-red-600">{errors.text.message}</p>}
          <div className="flex gap-3 items-center">
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add images" onClick={() => imgRef.current?.click()}>
              <PhotoIcon className="h-5 w-5 text-muted" />
            </button>
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add videos" onClick={() => vidRef.current?.click()}>
              <VideoCameraIcon className="h-5 w-5 text-muted" />
            </button>
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add files" onClick={() => docRef.current?.click()}>
              <PaperClipIcon className="h-5 w-5 text-muted" />
            </button>
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Record audio" onClick={() => setRecOpen(true)}>
              <MicrophoneIcon className="h-5 w-5 text-muted" />
            </button>
            <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={vidRef} type="file" accept="video/*" multiple hidden onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain,text/csv" multiple hidden onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <AudioRecorderModal open={recOpen} onClose={() => setRecOpen(false)} onSave={(b) => { setAudio(b); setRecOpen(false); }} />
          </div>
          {(files.length > 0 || audio) && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative rounded border border-token overflow-hidden">
                    {p.kind === 'image' ? (
                      <img src={p.url} className="w-full h-24 object-cover" />
                    ) : p.kind === 'video' ? (
                      <video src={p.url} className="w-full h-24 object-cover" />
                    ) : p.kind === 'audio' ? (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                          <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                        </span>
                        <span className="text-muted">Audio</span>
                      </div>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                          <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                        </span>
                        <span className="text-muted">{getDocLabel(p.ext)}</span>
                      </div>
                    )}
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              {audio && (
                <div className="flex items-center gap-2">
                  <audio controls src={URL.createObjectURL(audio)} />
                  <Button type="button" variant="outline" onClick={() => { setViewerUrl(URL.createObjectURL(audio)); setViewerType('audio'); setViewerOpen(true); }}>Preview</Button>
                  <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Remove audio" onClick={() => setAudio(null)}>
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              disabled={isSubmitting}
              leftIcon={isSubmitting ? <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}
            >
              {isSubmitting ? "Posting..." : "Post Answer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Full attachment viewer */}
      <Modal
        open={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerMeta(null); }}
        title=""
        panelClassName="max-w-2xl p-3"
        titleClassName="hidden"
      >
        {viewerUrl && viewerType === 'image' && (
          <img src={viewerUrl} className="w-full h-auto rounded-md" />
        )}
        {viewerUrl && viewerType === 'video' && (
          <video src={viewerUrl} className="w-full rounded-md" controls autoPlay />
        )}
        {viewerUrl && viewerType === 'audio' && (
          <audio src={viewerUrl} className="w-full" controls autoPlay />
        )}
        {viewerMeta && (
          <div className="mt-2 text-xs text-muted">by {viewerMeta.by} · {new Date(viewerMeta.date).toLocaleString()}</div>
        )}
      </Modal>

      {/* Edit Question */}
      <Modal open={editQuestion.open} onClose={() => setEditQuestion({ ...editQuestion, open: false })} title="Edit Question">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setSavingQuestion(true);
              let finalQAttachments = editQuestion.attachments.slice();
              if (newEditFiles.length) {
                const up = await uploadApi.upload(newEditFiles);
                finalQAttachments = finalQAttachments.concat(up.files.map(f => f.url));
              }
              await questionsApi.update(q.questionId, { title: editQuestion.title, description: editQuestion.description, attachments: finalQAttachments });
              toast.success('Question updated');
              setEditQuestion({ ...editQuestion, open: false });
              setNewEditFiles([]);
              await load();
            } catch (err: any) { toast.error(err.message); }
            finally { setSavingQuestion(false); }
          }}
          className="space-y-3"
        >
          <input
            type="text"
            value={editQuestion.title}
            onChange={(e) => setEditQuestion({ ...editQuestion, title: e.target.value })}
            className="w-full rounded border border-token bg-surface px-3 py-2 text-sm"
            placeholder="Title"
          />
          <Textarea value={editQuestion.description} onChange={(e) => setEditQuestion({ ...editQuestion, description: e.target.value })} />
          {editQuestion.attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {editQuestion.attachments.map((url, i) => (
                <div key={i} className="relative rounded border border-token overflow-hidden">
                  {url.match(/\.(png|jpe?g|gif|webp)$/i) ? <img src={url} className="w-full h-24 object-cover" /> : url.match(/\.(mp4|webm|ogg)$/i) ? <video src={url} className="w-full h-24 object-cover" /> : url.match(/\.(mp3|wav|m4a|aac|oga)$/i) ? (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                        <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                      </span>
                      <span className="text-muted">Audio</span>
                    </div>
                  ) : url.match(/\.(pdf|docx?|pptx?|xlsx?|txt|csv)$/i) ? (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                        <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                      </span>
                      <span className="text-muted">{url.match(/\.pdf$/i) ? 'PDF' : url.match(/\.docx?$/i) ? 'Word' : url.match(/\.xlsx?$/i) ? 'Excel' : url.match(/\.pptx?$/i) ? 'PowerPoint' : url.match(/\.csv$/i) ? 'CSV' : 'Document'}</span>
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                        <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                      </span>
                      <span className="text-muted">Document</span>
                    </div>
                  )}
                  <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setEditQuestion({ ...editQuestion, attachments: editQuestion.attachments.filter((_, idx) => idx !== i) })}>
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {editPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {editPreviews.map((p, i) => (
                <div key={i} className="relative rounded border border-token overflow-hidden">
                  {p.kind === 'image' ? <img src={p.url} className="w-full h-24 object-cover" /> : p.kind === 'video' ? <video src={p.url} className="w-full h-24 object-cover" /> : p.kind === 'audio' ? (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                        <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                      </span>
                      <span className="text-muted">Audio</span>
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                        <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                      </span>
                      <span className="text-muted">Document</span>
                    </div>
                  )}
                  <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setNewEditFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
            <div className="flex items-center gap-3">
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add images" onClick={() => editImgRef.current?.click()} disabled={savingQuestion}>
                <PhotoIcon className="h-5 w-5 text-muted" />
              </button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add videos" onClick={() => editVidRef.current?.click()} disabled={savingQuestion}>
                <VideoCameraIcon className="h-5 w-5 text-muted" />
              </button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add files" onClick={() => editDocRef.current?.click()} disabled={savingQuestion}>
                <PaperClipIcon className="h-5 w-5 text-muted" />
              </button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Record audio" onClick={() => setEditRecOpen(true)} disabled={savingQuestion}>
                <MicrophoneIcon className="h-5 w-5 text-muted" />
              </button>
              <input ref={editImgRef} type="file" accept="image/*" multiple hidden onChange={(e) => setNewEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <input ref={editVidRef} type="file" accept="video/*" multiple hidden onChange={(e) => setNewEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <input ref={editDocRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain" multiple hidden onChange={(e) => setNewEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <AudioRecorderModal open={editRecOpen} onClose={() => setEditRecOpen(false)} onSave={(b) => { setEditAudio(b); setEditRecOpen(false); }} />
            </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditQuestion({ ...editQuestion, open: false })}>Cancel</Button>
            <Button type="submit" disabled={savingQuestion} leftIcon={savingQuestion ? <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}>
              {savingQuestion ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete Question */}
      <Modal open={confirmDeleteQuestion} onClose={() => setConfirmDeleteQuestion(false)} title="Delete Question">
        <div className="space-y-3">
          <p className="text-sm">Are you sure you want to delete this question? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteQuestion(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletingQuestion}
              leftIcon={deletingQuestion ? <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}
              onClick={async () => {
                try {
                  setDeletingQuestion(true);
                  await questionsApi.remove(q.questionId);
                  toast.success('Question deleted');
                  setConfirmDeleteQuestion(false);
                  history.back();
                } catch (err: any) { toast.error(err.message); }
                finally { setDeletingQuestion(false); }
              }}
            >
              {deletingQuestion ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit answer modal */}
      <Modal open={!!editAnswer} onClose={() => { setEditAnswer(null); setNewEditFiles([]); }} title="Edit Answer">
        {editAnswer && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSavingEditAnswer(true);
                let finalAttachments = editAnswer.attachments.slice();
                if (newEditFiles.length || editAudio) {
                  const up = await uploadApi.upload(newEditFiles);
                  finalAttachments = finalAttachments.concat(up.files.map(f => f.url));
                  if (editAudio) {
                    const file = new File([editAudio], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
                    const upA = await uploadApi.upload([file]);
                    finalAttachments = finalAttachments.concat(upA.files.map(f => f.url));
                  }
                }
                await questionsApi.updateAnswer(q.questionId, editAnswer.id, { text: editAnswer.text, attachments: finalAttachments });
                toast.success('Answer updated');
                setEditAnswer(null);
                setNewEditFiles([]);
                await load();
              } catch (err: any) { toast.error(err.message); }
              finally { setSavingEditAnswer(false); }
            }}
            className="space-y-3"
          >
            <Textarea value={editAnswer.text} onChange={(e) => setEditAnswer({ ...editAnswer, text: e.target.value })} />
            {editAnswer.attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {editAnswer.attachments.map((url, i) => (
                  <div key={i} className="relative rounded border border-token overflow-hidden">
                    {url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                      <img src={url} className="w-full h-24 object-cover" />
                    ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={url} className="w-full h-24 object-cover" />
                    ) : url.match(/\.(mp3|wav|m4a|aac|oga)$/i) ? (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                          <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                        </span>
                        <span className="text-muted">Audio</span>
                      </div>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                          <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                        </span>
                        <span className="text-muted">Document</span>
                      </div>
                    )}
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setEditAnswer({ ...editAnswer, attachments: editAnswer.attachments.filter((_, idx) => idx !== i) })}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {editPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {editPreviews.map((p, i) => (
                  <div key={i} className="relative rounded border border-token overflow-hidden">
                    {p.kind === 'image' ? <img src={p.url} className="w-full h-24 object-cover" /> : p.kind === 'video' ? <video src={p.url} className="w-full h-24 object-cover" /> : p.kind === 'audio' ? (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                          <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                        </span>
                        <span className="text-muted">Audio</span>
                      </div>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                          <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                        </span>
                        <span className="text-muted">Document</span>
                      </div>
                    )}
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setNewEditFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add images" onClick={() => editImgRef.current?.click()}>
                <PhotoIcon className="h-5 w-5 text-muted" />
              </button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add videos" onClick={() => editVidRef.current?.click()}>
                <VideoCameraIcon className="h-5 w-5 text-muted" />
              </button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add files" onClick={() => editDocRef.current?.click()}>
                <PaperClipIcon className="h-5 w-5 text-muted" />
              </button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Record audio" onClick={() => setEditRecOpen(true)}>
                <MicrophoneIcon className="h-5 w-5 text-muted" />
              </button>
              <input ref={editImgRef} type="file" accept="image/*" multiple hidden onChange={(e) => setNewEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <input ref={editVidRef} type="file" accept="video/*" multiple hidden onChange={(e) => setNewEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <input ref={editDocRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain" multiple hidden onChange={(e) => setNewEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <AudioRecorderModal open={editRecOpen} onClose={() => setEditRecOpen(false)} onSave={(b) => { setEditAudio(b); setEditRecOpen(false); }} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditAnswer(null)}>Cancel</Button>
              <Button type="submit" disabled={savingEditAnswer} leftIcon={savingEditAnswer ? <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}>
                {savingEditAnswer ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Answer">
        <div className="space-y-3">
          <p className="text-sm">Are you sure you want to delete this answer? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletingAnswer}
              leftIcon={deletingAnswer ? <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  setDeletingAnswer(true);
                  await questionsApi.removeAnswer(q.questionId, confirmDelete.id);
                  toast.success('Answer deleted');
                  setConfirmDelete(null);
                  await load();
                } catch (err: any) { toast.error(err.message); }
                finally { setDeletingAnswer(false); }
              }}
            >
              {deletingAnswer ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReplySection({ questionId, ownerUserId, answer, currentUserName, onReload, onOpenDoc, onOpenMedia }: { questionId: string; ownerUserId: string; answer: any; currentUserName: string; onReload: () => Promise<void>; onOpenDoc: (url: string) => void; onOpenMedia: (url: string, type: 'image' | 'video' | 'audio', by: string, date: string) => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [rFiles, setRFiles] = useState<File[]>([]);
  const [rPreviews, setRPreviews] = useState<{ url: string; kind: 'image' | 'video' | 'audio' | 'doc'; name?: string; ext?: string }[]>([]);
  const rImg = useRef<HTMLInputElement | null>(null);
  const rVid = useRef<HTMLInputElement | null>(null);
  const rDoc = useRef<HTMLInputElement | null>(null);
  const [editOpen, setEditOpen] = useState<{ replyId: string; text: string; attachments: string[] } | null>(null);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editPreviews, setEditPreviews] = useState<{ url: string; kind: 'image' | 'video' | 'audio' | 'doc' }[]>([]);
  const eImg = useRef<HTMLInputElement | null>(null);
  const eVid = useRef<HTMLInputElement | null>(null);
  const eDoc = useRef<HTMLInputElement | null>(null);
  const [editRecOpen, setEditRecOpen] = useState(false);
  const [editAudio, setEditAudio] = useState<Blob | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const p: { url: string; kind: 'image' | 'video' | 'audio' | 'doc'; name?: string; ext?: string }[] = [];
    rFiles.forEach(f => {
      const name = f.name || '';
      const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = (extMatch?.[1] || '').toLowerCase();
      p.push({ url: URL.createObjectURL(f), kind: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'doc', name, ext });
    });
    setRPreviews(p);
    return () => p.forEach(x => URL.revokeObjectURL(x.url));
  }, [rFiles]);

  useEffect(() => {
    const p: { url: string; kind: 'image' | 'video' | 'audio' | 'doc' }[] = [];
    editFiles.forEach(f => p.push({ url: URL.createObjectURL(f), kind: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'doc' }));
    setEditPreviews(p);
    return () => p.forEach(x => URL.revokeObjectURL(x.url));
  }, [editFiles]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!user || !user.userId) { toast.error('Please login again'); return; }
    try {
      setSaving(true);
      const attachments: string[] = [];
      if (rFiles.length) {
        const up = await uploadApi.upload(rFiles);
        attachments.push(...up.files.map(f => f.url));
      }
      await questionsApi.addReply(questionId, answer.answerId, { repliedById: user.userId, authorName: user.name, text: text.trim(), attachments } as any);
      setText("");
      setRFiles([]);
      setOpen(false);
      await onReload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasReplies = Array.isArray((answer as any).replies) && (answer as any).replies.length > 0;
  return (
    <div className={open || hasReplies ? "mt-2" : "mt-0"}>
      <button id={`reply-toggle-${answer.answerId}`} className="hidden" onClick={() => setOpen(v => !v)} />
      {open && (
        <form onSubmit={submit} className="mt-2 space-y-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply..." className="w-full rounded border border-token bg-surface px-3 py-2 text-sm" />
          <div className="flex gap-2 items-center">
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" onClick={() => rImg.current?.click()} title="Add images"><PhotoIcon className="h-5 w-5 text-muted" /></button>
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" onClick={() => rVid.current?.click()} title="Add videos"><VideoCameraIcon className="h-5 w-5 text-muted" /></button>
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" onClick={() => rDoc.current?.click()} title="Add files"><PaperClipIcon className="h-5 w-5 text-muted" /></button>
            <input ref={rImg} type="file" accept="image/*" multiple hidden onChange={(e) => setRFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={rVid} type="file" accept="video/*" multiple hidden onChange={(e) => setRFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={rDoc} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain,text/csv" multiple hidden onChange={(e) => setRFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
          </div>
          {rPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {rPreviews.map((p, i) => (
                <div key={i} className="relative rounded border border-token overflow-hidden">
                  {p.kind === 'image' ? (
                    <img src={p.url} className="w-full h-24 object-cover" />
                  ) : p.kind === 'video' ? (
                    <video src={p.url} className="w-full h-24 object-cover" />
                  ) : p.kind === 'audio' ? (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20">
                        <SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                      </span>
                      <span className="text-muted">Audio</span>
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                        <DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                      </span>
                      <span className="text-muted">{(p.ext || '').toLowerCase() === 'pdf' ? 'PDF' : (p.ext || '').toLowerCase() === 'doc' || (p.ext || '').toLowerCase() === 'docx' ? 'Word' : (p.ext || '').toLowerCase() === 'xls' || (p.ext || '').toLowerCase() === 'xlsx' ? 'Excel' : (p.ext || '').toLowerCase() === 'ppt' || (p.ext || '').toLowerCase() === 'pptx' ? 'PowerPoint' : (p.ext || '').toLowerCase() === 'csv' ? 'CSV' : (p.ext || '').toLowerCase() === 'txt' ? 'TXT' : 'Document'}</span>
                    </div>
                  )}
                  <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setRFiles(prev => prev.filter((_, idx) => idx !== i))}>
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" disabled={saving} leftIcon={saving ? <span className="h-3 w-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}>{saving ? 'Posting...' : 'Post Reply'}</Button>
          </div>
        </form>
      )}

      {/* Existing replies */}
      {hasReplies && (
      <div className="mt-2 space-y-2">
        {(answer as any).replies.map((r: any) => (
          <div key={r.replyId} className="ml-3">
            <div className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="text-sm flex-1 pr-2">{r.text}</div>
                {(user?.userId === ownerUserId || user?.name === r.repliedBy || user?.userId === (r as any).repliedById) && (
                  <div className="relative">
                    <button className="p-1 rounded hover:bg-[var(--color-accent)]/10" title="More" onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById(`reply-menu-${r.replyId}`);
                      if (el) el.classList.toggle('hidden');
                    }}>
                      <EllipsisVerticalIcon className="h-5 w-5 text-muted" />
                    </button>
                    <div id={`reply-menu-${r.replyId}`} className="hidden absolute right-0 mt-1 w-28 rounded-md bg-white dark:bg-[var(--color-surface)] shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50">
                      {(user?.name === r.repliedBy || user?.userId === (r as any).repliedById) && (
                        <button className="block w-full px-3 py-2 text-left hover:bg-[var(--color-accent)]/10 text-sm" onClick={() => {
                          (document.getElementById(`reply-menu-${r.replyId}`) as any)?.classList.add('hidden');
                          setEditOpen({ replyId: r.replyId, text: r.text, attachments: r.attachments || [] });
                          setEditFiles([]);
                        }}>Edit</button>
                      )}
                      <button className="block w-full px-3 py-2 text-left hover:bg-red-500/10 text-sm text-red-600" onClick={async () => {
                        (document.getElementById(`reply-menu-${r.replyId}`) as any)?.classList.add('hidden');
                        try { await questionsApi.removeReply(questionId, answer.answerId, r.replyId); toast.success('Reply deleted'); await onReload(); } catch (e: any) { toast.error(e.message); }
                      }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
              {Array.isArray(r.attachments) && r.attachments.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {r.attachments.map((url: string, i: number) => (
                    <button key={i} type="button" className="rounded border border-token overflow-hidden text-left" onClick={() => { const isImage = url.match(/\.(png|jpe?g|gif|webp)$/i); const isVideo = url.match(/\.(mp4|webm|ogg)$/i); const isAudio = url.match(/\.(mp3|wav|m4a|aac|oga)$/i); const isDoc = url.includes('/raw/upload/') || url.match(/\.(pdf|docx?|pptx?|xlsx?|txt|csv)$/i); if (isDoc) { onOpenDoc(url); return; } onOpenMedia(url, isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'image', r.repliedBy, String(r.date)); }}>
                      {url.match(/\.(png|jpe?g|gif|webp)$/i) ? <img src={url} className="w-full h-24 object-cover" /> : url.match(/\.(mp4|webm|ogg)$/i) ? <video src={url} className="w-full h-24 object-cover" controls /> : url.match(/\.(mp3|wav|m4a|aac|oga)$/i) ? (
                        <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20"><SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" /></span><span className="text-muted">Audio</span></div>
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20"><DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" /></span><span className="text-muted">{url.match(/\.pdf$/i) ? 'PDF' : url.match(/\.docx?$/i) ? 'Word' : url.match(/\.xlsx?$/i) ? 'Excel' : url.match(/\.pptx?$/i) ? 'PowerPoint' : url.match(/\.csv$/i) ? 'CSV' : url.match(/\.txt$/i) ? 'TXT' : 'Document'}</span></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-2 text-[11px] text-muted flex items-center gap-2">
                {(r as any).repliedByAvatarUrl ? (
                  <img src={(r as any).repliedByAvatarUrl} alt="avatar" className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-secondary)]/20">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-[var(--color-secondary)]"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor"/></svg>
                  </span>
                )}
                <span>by {r.repliedBy} · {new Date(r.date).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
      {/* Edit Reply Modal */}
      <Modal open={!!editOpen} onClose={() => editSaving ? undefined : setEditOpen(null)} title="Edit Reply">
        {editOpen && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setEditSaving(true);
                const toUpload = editFiles.slice();
                if (editAudio) toUpload.push(new File([editAudio], `audio-${Date.now()}.webm`, { type: 'audio/webm' }));
                let newUrls: string[] = [];
                if (toUpload.length) {
                  const up = await uploadApi.upload(toUpload);
                  newUrls = up.files.map(f => f.url);
                }
                const final = [...(editOpen.attachments || []), ...newUrls];
                await questionsApi.updateReply(questionId, answer.answerId, editOpen.replyId, { text: editOpen.text, attachments: final });
                toast.success('Reply updated');
                setEditOpen(null);
                setEditFiles([]);
                setEditAudio(null);
                await onReload();
              } catch (err: any) { toast.error(err.message); }
              finally { setEditSaving(false); }
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={editOpen.text}
              onChange={(e) => setEditOpen({ ...editOpen, text: e.target.value })}
              className="w-full rounded border border-token bg-surface px-3 py-2 text-sm"
              placeholder="Reply"
            />
            {(editOpen.attachments?.length || editFiles.length || editAudio) ? (
              <div className="grid grid-cols-3 gap-2">
                {editOpen.attachments?.map((url, i) => (
                  <div key={`ex-${i}`} className="relative rounded border border-token overflow-hidden">
                    {url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                      <img src={url} className="w-full h-24 object-cover" />
                    ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={url} className="w-full h-24 object-cover" />
                    ) : url.match(/\.(mp3|wav|m4a|aac|oga)$/i) ? (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20"><SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" /></span><span className="text-muted">Audio</span></div>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20"><DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" /></span><span className="text-muted">Document</span></div>
                    )}
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setEditOpen({ ...editOpen, attachments: editOpen.attachments.filter((_, idx) => idx !== i) })}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                {editPreviews.map((p, i) => (
                  <div key={`np-${i}`} className="relative rounded border border-token overflow-hidden">
                    {p.kind === 'image' ? <img src={p.url} className="w-full h-24 object-cover" /> : p.kind === 'video' ? <video src={p.url} className="w-full h-24 object-cover" /> : p.kind === 'audio' ? (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20"><SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" /></span><span className="text-muted">Audio</span></div>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]/20"><DocumentTextIcon className="h-5 w-5 text-[var(--color-secondary)]" /></span><span className="text-muted">Document</span></div>
                    )}
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setEditFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                {editAudio && (
                  <div className="relative rounded border border-token overflow-hidden">
                    <div className="flex h-24 w-full items-center justify-center gap-2 bg-surface text-xs"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20"><SpeakerWaveIcon className="h-5 w-5 text-[var(--color-accent)]" /></span><span className="text-muted">Recorded audio</span></div>
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setEditAudio(null)}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add images" onClick={() => eImg.current?.click()}><PhotoIcon className="h-5 w-5 text-muted" /></button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add videos" onClick={() => eVid.current?.click()}><VideoCameraIcon className="h-5 w-5 text-muted" /></button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add files" onClick={() => eDoc.current?.click()}><PaperClipIcon className="h-5 w-5 text-muted" /></button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Record audio" onClick={() => setEditRecOpen(true)}><MicrophoneIcon className="h-5 w-5 text-muted" /></button>
            </div>
            <input ref={eImg} type="file" accept="image/*" multiple hidden onChange={(e) => setEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={eVid} type="file" accept="video/*" multiple hidden onChange={(e) => setEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={eDoc} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain,text/csv" multiple hidden onChange={(e) => setEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { if (!editSaving) { setEditOpen(null); setEditFiles([]); setEditAudio(null);} }}>Cancel</Button>
              <Button type="submit" disabled={editSaving} leftIcon={editSaving ? <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> : undefined}>{editSaving ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        )}
      </Modal>
      <AudioRecorderModal open={editRecOpen} onClose={() => setEditRecOpen(false)} onSave={(b) => { setEditAudio(b); setEditRecOpen(false); }} />
    </div>
  );
}
 
