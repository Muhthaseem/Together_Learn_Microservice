"use client";
import { useEffect, useState, useRef } from "react";
import { questionsApi, coursesApi, uploadApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ComboBox } from "@/components/ui/ComboBox";
import { Card, Badge } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import dynamic from "next/dynamic";
const AudioRecorderModal = dynamic(() => import("@/components/ui/AudioRecorderModal").then(m => m.default), { ssr: false });
import { PlusIcon, ChatBubbleLeftRightIcon, PhotoIcon, VideoCameraIcon, MicrophoneIcon, XMarkIcon, SpeakerWaveIcon, DocumentTextIcon, PaperClipIcon, BarsArrowDownIcon } from "@heroicons/react/24/solid";
import { EmptyState } from "@/components/ui/Feedback";
import { Avatar } from "@/components/ui/Avatar";

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  description: z.string().min(10, "Description is too short"),
  courseModule: z.string().min(1, "Select a course"),
});

export default function QuestionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ items: any[]; page: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<string>("-createdAt");

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting }, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<{ url: string; kind: 'image' | 'video' | 'audio' | 'doc'; name?: string; ext?: string }[]>([]);

  useEffect(() => {
    const urls: { url: string; kind: 'image' | 'video' | 'audio' | 'doc'; name?: string; ext?: string }[] = [];
    selectedFiles.forEach((f) => {
      const url = URL.createObjectURL(f);
      const name = f.name || '';
      const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
      const ext = (extMatch?.[1] || '').toLowerCase();
      const kind = f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'doc';
      urls.push({ url, kind, name, ext });
    });
    setPreviews(urls);
    return () => urls.forEach((p) => URL.revokeObjectURL(p.url));
  }, [selectedFiles]);

  const courseModule = watch("courseModule");

  useEffect(() => {
    (async () => {
      try {
        const all = await coursesApi.list();
        const opts = all.map((m) => `${m.code} - ${m.title}`);
        setCourseOptions(opts);
        // do not set default; leave empty so list shows all by default
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, courseModule, search, sort]);

  async function load() {
    const res = await questionsApi.list({ courseModule: courseModule || undefined, q: search || undefined, page, limit: 5, sort }).catch(() => null);
    if (res) setData(res);
  }

  function formatTime12h(t: string): string {
    try {
      const d = new Date(t);
      if (!Number.isFinite(d.getTime())) return t;
      const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      const hh = d.getHours();
      const mm = d.getMinutes();
      const suffix = hh >= 12 ? 'PM' : 'AM';
      const hour12 = ((hh + 11) % 12) + 1;
      return `${dateStr} ${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
    } catch {
      return t;
    }
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return;
    try {
      const mediaUrls: string[] = [];
      if (selectedFiles.length) {
        const up = await uploadApi.upload(selectedFiles);
        mediaUrls.push(...up.files.map(f => f.url));
      }
      if (audioBlob) {
        const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        const up = await uploadApi.upload([file]);
        mediaUrls.push(...up.files.map(f => f.url));
      }
      await questionsApi.create({
        userId: user.userId,
        userName: user.name,
        department: user.department,
        batch: user.batch,
        courseModule: values.courseModule,
        title: values.title,
        description: values.description,
        attachments: mediaUrls,
      } as any);
      toast.success("Question posted");
      reset({ title: "", description: "", courseModule: values.courseModule });
      setSelectedFiles([]);
      setAudioBlob(null);
      setOpen(false);
      setPage(1);
      await load();
    } catch (e) {
      toast.error("Failed to post question");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Q&A Forum</h1>
        <div className="sm:hidden flex items-center justify-between">
          <div className="relative">
            <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Filters" onClick={() => setSortOpen(v => !v)}>
              <BarsArrowDownIcon className="h-5 w-5 text-muted" />
            </button>
            {sortOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div className="absolute left-0 mt-2 w-[22rem] max-w-[90vw] rounded-md surface border border-token shadow-xl z-50 p-3">
                <div className="grid gap-3">
                  <div>
                    <div className="text-xs text-muted mb-1">Course Module</div>
                    <ComboBox className="max-w-full" options={courseOptions} value={courseModule || ""} onChange={(v) => setValue("courseModule", v)} onSearch={async (q) => {
                      const res = await coursesApi.search(q).catch(() => []);
                      setCourseOptions((res as any[]).map((m: any) => `${m.code} - ${m.title}`));
                    }} placeholder="Search course..." />
                  </div>
                  <div>
                    <div className="text-xs text-muted mb-1">Search</div>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or description" />
                  </div>
                  
                </div>
              </div>
              </>
            )}
          </div>
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>Ask Question</Button>
        </div>
        <div className="mt-3 hidden sm:flex items-center gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Course Module</label>
            <ComboBox
              className="max-w-xs"
              options={courseOptions}
              value={courseModule || ""}
              onChange={(v) => setValue("courseModule", v)}
              onSearch={async (q) => {
                const res = await coursesApi.search(q).catch(() => []);
                setCourseOptions((res as any[]).map((m: any) => `${m.code} - ${m.title}`));
              }}
              placeholder="Search course..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or description" />
          </div>
          <Button className="ml-auto" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setOpen(true)}>Ask Question</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.items.length === 0 && (
          <EmptyState
            title="No questions yet"
            description="Ask a question to get help from peers."
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-[var(--color-secondary)]" />}
          />
        )}
        {data?.items.map((q) => (
          <a key={q.questionId} href={`/dashboard/questions/${q.questionId}`} className="block">
            <Card className="hover:shadow-sm transition-shadow flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium inline-flex items-center gap-2">{q.title}</div>
                  <Badge>{q.courseModule}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1 bg-surface">
                    {((q as any).userAvatarUrl) ? (
                      <Avatar src={(q as any).userAvatarUrl} alt={q.userName} size={20} />
                    ) : (
                      <Avatar alt={q.userName} size={20} />
                    )}
                    <span className="font-medium">{q.userName}</span>
                    {q.userIndex && (
                      <span className="text-[10px] text-muted ml-1">{q.userIndex}</span>
                    )}
                  </span>
                </div>
                <div className="mt-2 flex items-start gap-3">
                  <p className="text-sm flex-1 leading-6" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.description}</p>
                  {Array.isArray((q as any).attachments) && (q as any).attachments.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 w-[120px]">
                      {(q as any).attachments.slice(0, 3).map((url: string, i: number) => (
                        <div key={i} className="h-12 w-full rounded border border-token overflow-hidden bg-surface flex items-center justify-center">
                          {url.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                            <img src={url} className="h-full w-full object-cover" />
                          ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <div className="flex h-full w-full items-center justify-center text-[var(--color-secondary)]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[var(--color-secondary)]"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M6 2a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2H6z"/></svg></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted text-right">
                {formatTime12h((q as any).date)}
              </div>
            </Card>
          </a>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Prev</Button>
        <div className="text-sm">Page {data?.page || 1} {data ? `of ${data.pages}` : ''}</div>
        <Button variant="outline" disabled={!!data && page >= (data.pages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ask a question">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block text-sm font-medium mb-1">Course Module</label>
          <ComboBox options={courseOptions} value={courseModule || ""} onChange={(v) => setValue("courseModule", v)} onSearch={async (q) => {
            const res = await coursesApi.search(q).catch(() => []);
            setCourseOptions((res as any[]).map((m: any) => `${m.code} - ${m.title}`));
          }} placeholder="Search course..." />
          {errors.courseModule && <p className="text-sm text-red-600">{errors.courseModule.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input {...register("title")} placeholder="Title" />
          </div>
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea {...register("description")} placeholder="Describe your question" />
          </div>
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Attach media</label>
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add images" onClick={() => imageInputRef.current?.click()}><PhotoIcon className="h-5 w-5 text-muted" /></button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add videos" onClick={() => videoInputRef.current?.click()}><VideoCameraIcon className="h-5 w-5 text-muted" /></button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Add files" onClick={() => docInputRef.current?.click()}><PaperClipIcon className="h-5 w-5 text-muted" /></button>
              <button type="button" className="p-2 rounded hover:bg-[var(--color-accent)]/10" title="Record audio" onClick={() => setRecOpen(true)}><MicrophoneIcon className="h-5 w-5 text-muted" /></button>
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={videoInputRef} type="file" accept="video/*" multiple hidden onChange={(e) => setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            <input ref={docInputRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/plain,text/csv" onChange={(e) => setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            <AudioRecorderModal open={recOpen} onClose={() => setRecOpen(false)} onSave={(b) => { setAudioBlob(b); setRecOpen(false); }} />
            {(selectedFiles.length > 0) && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative rounded border border-token overflow-hidden">
                    {p.kind === 'image' ? (
                      <img src={p.url} alt="preview" className="w-full h-24 object-cover" />
                    ) : p.kind === 'video' ? (
                      <video src={p.url} className="w-full h-24 object-cover" controls />
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
                    <button type="button" className="absolute top-1 right-1 p-1 rounded bg-black/50" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <XMarkIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {audioBlob && (
              <div className="mt-2 inline-flex items-center gap-2 rounded border border-token px-2 py-1 bg-surface">
                <SpeakerWaveIcon className="h-4 w-4 text-[var(--color-accent)]" />
                <span className="text-sm text-muted">Recorded audio</span>
                <button type="button" className="p-1 rounded hover:bg-[var(--color-accent)]/10" title="Remove" onClick={() => setAudioBlob(null)}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Posting..." : "Post"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


