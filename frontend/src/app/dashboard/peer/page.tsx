"use client";
import { useEffect, useState } from "react";
import { peerApi, peerRequestApi, type PeerRequest, type PeerClass, coursesApi, type CourseModule } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ComboBox } from "@/components/ui/ComboBox";
import { Card, Badge } from "@/components/ui/Card";
import { PlusIcon, AcademicCapIcon, BarsArrowDownIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { EmptyState } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";

const schema = z.object({
  title: z.string().min(3, "Title is too short"),
  courseModule: z.string().min(1, "Select a course"),
  description: z.string().min(10, "Description is too short"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  fee: z.string().optional(),
  location: z.string().optional(),
  mode: z.enum(['virtual','physical']).optional(),
});

const requestSchema = z.object({
  title: z.string().min(3),
  courseModule: z.string().min(1),
  description: z.string().min(10),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  mode: z.enum(['virtual','physical']).optional(),
  location: z.string().optional(),
  fee: z.string().optional(),
});

export default function PeerTeachingPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{ items: PeerClass[]; page: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [filterCourse, setFilterCourse] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState(false);
  const [requests, setRequests] = useState<PeerRequest[]>([]);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState<PeerClass | null>(null);
  const [editing, setEditing] = useState<PeerClass | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestDetail, setRequestDetail] = useState<(PeerRequest & { requesterDetail?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string }; participantsDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string }[]; hostDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string }[] }) | null>(null);
  const [editSchOpen, setEditSchOpen] = useState(false);
  const [cancelSchOpen, setCancelSchOpen] = useState(false);
  const [cancelReqOpen, setCancelReqOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<PeerRequest | null>(null);
  const [menuOpenClassId, setMenuOpenClassId] = useState<string | null>(null);
  const [menuOpenRequestId, setMenuOpenRequestId] = useState<string | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const courseModule = watch("courseModule");

  const { register: registerReq, handleSubmit: handleSubmitReq, reset: resetReq, formState: { errors: errorsReq, isSubmitting: isSubmittingReq }, setValue: setValueReq, watch: watchReq } = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
  });
  const reqCourseModule = watchReq("courseModule");

  const formatTime12hGlobal = (t: string) => {
    try {
      const [hh, mm] = t.split(":");
      const h = parseInt(hh, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = ((h + 11) % 12) + 1;
      return `${hr}:${mm} ${ampm}`;
    } catch { return t; }
  };

  useEffect(() => {
    (async () => {
      try {
        const all = await coursesApi.list();
        const opts = all.map((m) => `${m.code} - ${m.title}`);
        setCourseOptions(opts);
        if (!courseModule && opts[0]) setValue("courseModule", opts[0]);
        if (!reqCourseModule && opts[0]) setValueReq('courseModule', opts[0]);
      } catch {}
    })();
  }, [courseModule, reqCourseModule, setValue, setValueReq]);

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterCourse, search]);

  // If navigated with ?open=classId from dashboard, auto-open details
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const openId = params.get('open');
    if (openId) {
      (async () => {
        const full = await peerApi.get(openId).catch(() => null);
        if (full) setDetail(full);
      })();
    }
  }, []);

  async function load() {
    const list = await peerApi
      .list({ page, limit: 5, sort: '-createdAt', q: search || undefined, courseModule: filterCourse || undefined })
      .catch(() => null);
    if (list) setData(list);
    const reqs = await peerRequestApi
      .listOpen('open,scheduled', { q: search || undefined, courseModule: filterCourse || undefined })
      .catch(() => [] as PeerRequest[]);
    setRequests(reqs);
  }

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!user) return;
    try {
      await peerApi.create({
        tutorId: user.userId,
        creatorId: user.userId,
        title: values.title,
        department: user.department,
        courseModule: values.courseModule,
        description: values.description,
        date: values.date,
        time: values.time,
        fee: values.fee ? Number(values.fee) : undefined,
        hosts: [user.userId],
      } as PeerClass);
      toast.success("Class created");
      reset({ title: "", courseModule: values.courseModule, description: "", date: "", time: "", fee: "" });
      setPage(1);
      await load();
    } catch (e) {
      toast.error("Failed to create class");
    }
  };

  async function join(id: string) {
    try {
      if (!user) return;
      await peerApi.join(id, user.userId);
      toast.success("Joined class");
      await load();
    } catch (e) {
      toast.error("Failed to join class");
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-2">Peer Teaching</h1>
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
                        setCourseOptions(res.map((m) => `${m.code} - ${m.title}`));
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
          <div className="flex items-center gap-2">
            <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { setEditing(null); reset({ title: "", courseModule: courseModule || "", description: "", date: "", time: "", fee: "" }); setOpen(true); }}>Offer Class</Button>
             <Button variant="outline" onClick={() => { setEditingReq(null); setOpenRequest(true); }}>Request Class</Button>
          </div>
        </div>
        {/* Desktop filters */}
        <div className="mt-3 hidden sm:flex items-center gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Course Module</label>
            <ComboBox className="max-w-xs" options={courseOptions} value={filterCourse} onChange={setFilterCourse} onSearch={async (q) => {
              const res = await coursesApi.search(q).catch(() => [] as CourseModule[]);
              setCourseOptions(res.map((m) => `${m.code} - ${m.title}`));
            }} placeholder="Search course..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or description" />
          </div>
          <Button className="ml-auto" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { setEditing(null); reset({ title: "", courseModule: filterCourse || courseModule || "", description: "", date: "", time: "", fee: "" }); setOpen(true); }}>Offer Class</Button>
           <Button className="ml-0" variant="outline" onClick={() => { setEditingReq(null); setOpenRequest(true); }}>Request Class</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 items-start">
        <div className="grid gap-3 self-start">
          <h2 className="font-medium">Offered Classes</h2>
          {data?.items.length === 0 && (
          <EmptyState
            title="No classes offered yet"
            description="Offer a class or request one to get started."
            icon={<AcademicCapIcon className="h-6 w-6 text-[var(--color-secondary)]" />}
          />
          )}
          {data?.items.map((c) => {
          const isJoined = !!(user && (c.participants||[]).includes(user.userId));
          const formatTime12h = (t: string) => {
            try {
              const [hh, mm] = t.split(':');
              const h = parseInt(hh, 10);
              const ampm = h >= 12 ? 'PM' : 'AM';
              const hr = ((h + 11) % 12) + 1;
              return `${hr}:${mm} ${ampm}`;
            } catch { return t; }
          };
          const dateStr = c.date ? new Date(c.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '';
          return (
            <Card key={c.classId} className="cursor-pointer relative" onClick={async (e: React.MouseEvent)=>{
              if ((e.target as HTMLElement) instanceof HTMLButtonElement) return; // avoid opening when clicking action buttons
              const full = await peerApi.get(c.classId).catch(() => null);
              if (full) setDetail(full);
            }}>
              <div className="flex items-center justify-between">
                <div className="font-medium inline-flex items-center gap-2">{c.title}</div>
                <div className="inline-flex items-center gap-1">
                  <Badge>{c.courseModule}</Badge>
                  {user && (user.userId === c.creatorId || (c.hosts||[]).includes(user.userId)) && (
                    <button type="button" className="p-1 rounded hover:bg-[var(--color-surface)]" onClick={(e)=>{ e.stopPropagation(); setMenuOpenClassId(v => v === c.classId ? null : c.classId); }} aria-label="More">
                      <EllipsisVerticalIcon className="h-5 w-5 text-muted" />
                    </button>
                  )}
                </div>
              </div>
              {c.creatorName && (
                <div className="mt-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1 bg-surface">
                    {c.creatorAvatarUrl ? <Avatar src={c.creatorAvatarUrl} alt={c.creatorName} size={20} /> : <Avatar alt={c.creatorName} size={20} />}
                    <span className="font-medium">{c.creatorName}</span>
                    {(c.creatorIndexNumber || c.creatorRegistrationNumber) && <span className="text-[10px] text-muted">{c.creatorIndexNumber || c.creatorRegistrationNumber}</span>}
                  </span>
                </div>
              )}
              <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{c.description}</p>
              <div className="text-sm text-muted flex items-center justify-between flex-wrap gap-2 mt-1">
                <span>{dateStr} {c.time ? `• ${formatTime12h(c.time)}` : ''} {typeof c.fee === 'number' ? `• Rs.${c.fee}` : '• Free'}</span>
                {user && !(user.userId === c.creatorId || (c.hosts||[]).includes(user.userId)) && (
                  isJoined ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--color-success)]">You have already joined</span>
                      <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); (async()=>{ if(!user) return; await peerApi.unjoin(c.classId, user.userId); toast.success('Unjoined'); await load(); })(); }}>Unjoin</Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); join(c.classId); }}>Join</Button>
                  )
                )}
              </div>
              {menuOpenClassId === c.classId && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e)=>{ e.stopPropagation(); setMenuOpenClassId(null); }} />
                  <div className="absolute right-2 top-8 z-50 min-w-[160px] rounded-md surface border border-token shadow-xl p-1">
                    <button className="w-full text-left px-3 py-2 rounded hover:bg-[var(--color-surface)]" onClick={(e)=>{ e.stopPropagation(); setMenuOpenClassId(null); setEditing(c); setValue('title', c.title); setValue('courseModule', c.courseModule); setValue('description', c.description); setValue('date', (c.date||'').split('T')[0] || c.date); setValue('time', c.time || ''); setValue('fee', (typeof c.fee === 'number' ? String(c.fee) : '')); setOpen(true); }}>Edit</button>
                    <button className="w-full text-left px-3 py-2 rounded text-red-600 hover:bg-red-50" onClick={(e)=>{ e.stopPropagation(); setMenuOpenClassId(null); setDeleteClassId(c.classId); }}>Delete</button>
                  </div>
                </>
              )}
              <div className="text-xs text-muted mt-1">Participants: {(c.participants||[]).length} • Host: {c.hosts?.length || 1}</div>
            </Card>
          );
          })}
        </div>
        <div className="grid gap-3 self-start">
          <h2 className="font-medium">Requests</h2>
          <div className="grid gap-3">
            {requests.length === 0 && (
              <EmptyState
                title="No requests yet"
                description="Request a class to get started."
                icon={<AcademicCapIcon className="h-6 w-6 text-[var(--color-secondary)]" />}
              />
            )}
             {requests.map((r) => (
               <Card key={r.requestId} onClick={async()=>{ const full = await peerRequestApi.get(r.requestId).catch(()=>null); if (full) { setRequestDetail(full as any); setRequestOpen(true); } }} className="cursor-pointer relative">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.title}</div>
                  <div className="inline-flex items-center gap-1">
                    <Badge>{r.courseModule}</Badge>
                    {user && ((r.status === 'scheduled' && user.userId === r.acceptedBy) || (user.userId === r.requesterId)) && (
                      <button type="button" className="p-1 rounded hover:bg-[var(--color-surface)]" onClick={(e)=>{ e.stopPropagation(); setMenuOpenRequestId(v => v === r.requestId ? null : r.requestId); }} aria-label="More">
                        <EllipsisVerticalIcon className="h-5 w-5 text-muted" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted">by {r.requesterName} • {r.fromDate.split('T')[0]} → {r.toDate.split('T')[0]} {typeof r.fee === 'number' ? `• Rs.${r.fee}` : '• Free'}</div>
                {r.status === 'scheduled' && (
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)]">Scheduled</span>
                      {r.acceptedByName && (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-muted">Accepted by</span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1 bg-surface">
                            {r.acceptedByAvatarUrl ? <Avatar src={r.acceptedByAvatarUrl} alt={r.acceptedByName} size={20} /> : <Avatar alt={r.acceptedByName} size={20} />}
                            <span className="font-medium">{r.acceptedByName}</span>
                            {(r.acceptedByIndexNumber || r.acceptedByRegistrationNumber) && <span className="text-[10px] text-muted">{r.acceptedByIndexNumber || r.acceptedByRegistrationNumber}</span>}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : ''}
                      {r.scheduledTime ? ` • ${formatTime12hGlobal(r.scheduledTime)}` : ''}
                      {r.scheduledLocation ? ` • ${r.scheduledLocation}` : ''}
                    </div>
                  </div>
                )}
                <p className="text-sm mt-1">{r.description}</p>
                {user && !(user.userId === r.requesterId || (r.status === 'scheduled' && user.userId === r.acceptedBy)) && (
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <AcceptRequestButton request={r} tutorId={user.userId} onAccepted={load} />
                    {(r.participants || []).includes(user.userId) ? (
                      <Button size="sm" variant="outline" onClick={async(e)=>{ e.stopPropagation(); await peerRequestApi.unjoin(r.requestId, { userId: user.userId }); toast.success('Unjoined'); await load(); }}>Unjoin</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={async(e)=>{ e.stopPropagation(); await peerRequestApi.join(r.requestId, { userId: user.userId }); toast.success('Joined'); await load(); }}>Join</Button>
                    )}
                  </div>
                )}
                {menuOpenRequestId === r.requestId && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e)=>{ e.stopPropagation(); setMenuOpenRequestId(null); }} />
                    <div className="absolute right-2 top-8 z-50 min-w-[180px] rounded-md surface border border-token shadow-xl p-1">
                      {(r.status === 'scheduled' && user && user.userId === r.acceptedBy) ? (
                        <>
                          <button className="w-full text-left px-3 py-2 rounded hover:bg-[var(--color-surface)]" onClick={(e)=>{ e.stopPropagation(); setMenuOpenRequestId(null); setEditSchOpen(true); setRequestDetail(r as any); }}>Edit schedule</button>
                          <button className="w-full text-left px-3 py-2 rounded text-red-600 hover:bg-red-50" onClick={(e)=>{ e.stopPropagation(); setMenuOpenRequestId(null); setCancelSchOpen(true); setRequestDetail(r as any); }}>Cancel schedule</button>
                        </>
                      ) : user && user.userId === r.requesterId ? (
                        <>
                          <button className="w-full text-left px-3 py-2 rounded hover:bg-[var(--color-surface)]" onClick={(e)=>{ e.stopPropagation(); setMenuOpenRequestId(null); setEditingReq(r); setOpenRequest(true); setValueReq('title', r.title); setValueReq('courseModule', r.courseModule); setValueReq('description', r.description); setValueReq('fromDate', r.fromDate.split('T')[0]); setValueReq('toDate', r.toDate.split('T')[0]); setValueReq('fee', typeof r.fee === 'number' ? String(r.fee) : ''); setValueReq('location', r.location || ''); setValueReq('mode', r.mode || 'physical'); }}>Edit</button>
                          <button className="w-full text-left px-3 py-2 rounded text-red-600 hover:bg-red-50" onClick={(e)=>{ e.stopPropagation(); setMenuOpenRequestId(null); setRequestDetail(r as any); setCancelReqOpen(true); }}>Cancel request</button>
                        </>
                      ) : null}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Prev</Button>
        <div className="text-sm">Page {data?.page || 1} {data ? `of ${data.pages}` : ''}</div>
        <Button variant="outline" disabled={!!data && page >= (data.pages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>

      {/* Delete class confirm */}
      {deleteClassId && (
        <Modal open={!!deleteClassId} onClose={() => setDeleteClassId(null)} title="Delete class?">
          <div className="space-y-3">
            <p className="text-sm text-muted">This will permanently remove the class. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=> setDeleteClassId(null)}>Cancel</Button>
              <Button variant="danger" onClick={async()=>{ try { await peerApi.remove(deleteClassId); toast.success('Deleted'); setDeleteClassId(null); await load(); } catch { toast.error('Failed to delete'); } }}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit class" : "Offer a class"}>
        <form onSubmit={handleSubmit(async (values)=>{
          if (!user) return;
          if (!editing) return onSubmit(values);
          try {
            const payload: Partial<PeerClass> = {
              title: values.title,
              courseModule: values.courseModule,
              description: values.description,
              date: values.date,
              time: values.time,
              fee: values.fee ? Number(values.fee) : undefined,
              location: values.location || '',
              mode: values.mode === 'virtual' ? 'virtual' : 'physical',
            };
            await peerApi.update(editing.classId, payload);
            toast.success('Updated');
            setOpen(false);
            setEditing(null);
            await load();
          } catch {
            toast.error('Failed to update');
          }
        })} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input {...register("title")} placeholder="Title" />
          </div>
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          <label className="block text-sm font-medium mb-1">Course Module</label>
          <ComboBox options={courseOptions} value={courseModule || ""} onChange={(v) => setValue("courseModule", v)} onSearch={async (q) => {
            const res = await coursesApi.search(q).catch(() => [] as CourseModule[]);
            setCourseOptions(res.map((m) => `${m.code} - ${m.title}`));
          }} placeholder="Search course..." />
          {errors.courseModule && <p className="text-sm text-red-600">{errors.courseModule.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea {...register("description")} placeholder="Description" />
          </div>
          {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
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
              <label className="block text-sm font-medium mb-1">Fee (optional)</label>
              <Input type="number" min="0" {...register("fee")} placeholder="Fee (optional)" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{(watch('mode') || 'physical') === 'virtual' ? 'Meeting Link' : 'Location'}</label>
              <Input {...register('location')} placeholder={(watch('mode') || 'physical') === 'virtual' ? 'Paste meeting link' : 'Enter location'} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mode</label>
              <div className="flex items-center gap-4 h-10">
                <label className="inline-flex items-center gap-1 text-sm">
                  <input type="radio" value="physical" {...register('mode')} defaultChecked /> Physical
                </label>
                <label className="inline-flex items-center gap-1 text-sm">
                  <input type="radio" value="virtual" {...register('mode')} /> Virtual
                </label>
              </div>
            </div>
          </div>
          {(errors.date || errors.time) && (
            <p className="text-sm text-red-600">{errors.date?.message || errors.time?.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (editing ? "Saving..." : "Creating...") : (editing ? "Save" : "Create")}</Button>
          </div>
        </form>
      </Modal>

      {requestOpen && requestDetail && (
        <Modal open={requestOpen} onClose={()=> setRequestOpen(false)} title="Request details">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">{requestDetail.title}</div>
              <Badge>{requestDetail.courseModule}</Badge>
            </div>
            <div className="text-sm text-muted">{requestDetail.fromDate?.split('T')[0]} → {requestDetail.toDate?.split('T')[0]} {typeof requestDetail.fee === 'number' ? `• Rs.${requestDetail.fee}` : '• Free'}</div>
            <p className="text-sm whitespace-pre-wrap">{requestDetail.description}</p>
            <div>
              <div className="text-xs text-muted mb-1">Hosts</div>
              <div className="flex flex-wrap gap-2">
                {(requestDetail.hostDetails || []).map((u: any) => (
                  <span key={u.userId} className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1">
                    {u.avatarUrl ? <Avatar src={u.avatarUrl} alt={u.name} size={20} /> : <Avatar alt={u.name} size={20} />}
                    <span className="flex flex-col leading-tight">
                      <span>{u.name}</span>
                      {(u.indexNumber || u.registrationNumber) && <span className="text-[10px] text-muted">{u.indexNumber || u.registrationNumber}</span>}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Requester</div>
              {requestDetail.requesterDetail && (
                <span className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1">
                  {requestDetail.requesterDetail.avatarUrl ? <Avatar src={requestDetail.requesterDetail.avatarUrl} alt={requestDetail.requesterDetail.name} size={24} /> : <Avatar alt={requestDetail.requesterDetail.name} size={24} />}
                  <span className="flex flex-col leading-tight">
                    <span>{requestDetail.requesterDetail.name}</span>
                    {(requestDetail.requesterDetail.indexNumber || requestDetail.requesterDetail.registrationNumber) && <span className="text-[10px] text-muted">{requestDetail.requesterDetail.indexNumber || requestDetail.requesterDetail.registrationNumber}</span>}
                  </span>
                </span>
              )}
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Attendees ({requestDetail.participantsDetails?.length || 0})</div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-auto pr-1">
                {(requestDetail.participantsDetails || []).map((u: any) => (
                  <span key={u.userId} className="inline-flex items-center gap-2 rounded-full border border-token px-2 py-1">
                    {u.avatarUrl ? <Avatar src={u.avatarUrl} alt={u.name} size={20} /> : <Avatar alt={u.name} size={20} />}
                    <span className="flex flex-col leading-tight">
                      <span>{u.name}</span>
                      {(u.indexNumber || u.registrationNumber) && <span className="text-[10px] text-muted">{u.indexNumber || u.registrationNumber}</span>}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit schedule modal */}
      {editSchOpen && requestDetail && (
        <Modal open={editSchOpen} onClose={()=> setEditSchOpen(false)} title="Edit schedule">
          <form onSubmit={async (e)=>{ e.preventDefault(); const form = e.target as HTMLFormElement; const date = (form.elements.namedItem('date') as HTMLInputElement).value; const time = (form.elements.namedItem('time') as HTMLInputElement).value; const location = (form.elements.namedItem('location') as HTMLInputElement).value; try { await peerRequestApi.reschedule(requestDetail.requestId, { date, time, location }); toast.success('Rescheduled'); setEditSchOpen(false); await load(); } catch { toast.error('Failed to reschedule'); } }} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input name="date" type="date" defaultValue={(requestDetail.scheduledDate || (requestDetail as any).date)?.toString()?.split?.('T')?.[0]} required />
              <Input name="time" type="time" defaultValue={(requestDetail.scheduledTime || (requestDetail as any).time) as string} required />
              <Input name="location" placeholder="Location" defaultValue={(requestDetail.scheduledLocation || (requestDetail as any).location || '') as string} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=> setEditSchOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel schedule confirm */}
      {cancelSchOpen && requestDetail && (
        <Modal open={cancelSchOpen} onClose={()=> setCancelSchOpen(false)} title="Cancel schedule?">
          <div className="space-y-3">
            <p className="text-sm text-muted">This will remove the scheduled group and reopen the request.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=> setCancelSchOpen(false)}>No</Button>
              <Button variant="danger" onClick={async()=>{ try { await peerRequestApi.cancelSchedule(requestDetail.requestId); toast.success('Schedule cancelled'); setCancelSchOpen(false); await load(); } catch { toast.error('Failed to cancel'); } }}>Yes, cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel request confirm */}
      {cancelReqOpen && requestDetail && (
        <Modal open={cancelReqOpen} onClose={()=> setCancelReqOpen(false)} title="Cancel this request?">
          <div className="space-y-3">
            <p className="text-sm text-muted">This will close the request. Others will no longer see it.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=> setCancelReqOpen(false)}>No</Button>
              <Button variant="danger" onClick={async()=>{ try { await peerRequestApi.cancel(requestDetail.requestId); toast.success('Request cancelled'); setCancelReqOpen(false); await load(); } catch { toast.error('Failed to cancel'); } }}>Yes, cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal open={!!detail} onClose={() => setDetail(null)} title="Class details">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium inline-flex items-center gap-2"><AcademicCapIcon className="h-4 w-4 text-[var(--color-secondary)]" />{detail.title}</div>
              <Badge>{detail.courseModule}</Badge>
            </div>
            <p className="text-sm text-muted whitespace-pre-wrap">{detail.description}</p>
            <div className="text-sm text-muted">
              {new Date(detail.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
              {detail.time ? ` • ${(() => { try { const [hh, mm] = detail.time.split(':'); const h = parseInt(hh, 10); const ampm = h >= 12 ? 'PM' : 'AM'; const hr = ((h + 11) % 12) + 1; return `${hr}:${mm} ${ampm}`; } catch { return detail.time; } })()}` : ''}
              {typeof detail.fee === 'number' ? ` • Rs.${detail.fee}` : ' • Free'}
              {(detail.mode === 'virtual' ? ' • Virtual' : ' • Physical')}
              {detail.location ? ` • ${detail.mode === 'virtual' ? 'Link' : 'Location'}: ${detail.location}` : ''}
            </div>
            <div className="text-xs text-muted">Participants: {(detail.participants||[]).length} • Host: {detail.hosts?.length || 1}</div>
          <div>
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
          </div>
          <div>
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
          </div>
            <div className="pt-2 flex justify-end gap-2">
              {user && (user.userId === detail.creatorId || (detail.hosts||[]).includes(user.userId)) ? (
                <>
                  <Button size="sm" variant="outline" onClick={()=>{ if (detail) { setEditing(detail); setValue('title', detail.title); setValue('courseModule', detail.courseModule); setValue('description', detail.description); setValue('date', (detail.date||'').split('T')[0] || detail.date); setValue('time', detail.time || ''); setValue('fee', (typeof detail.fee === 'number' ? String(detail.fee) : '')); } setOpen(true); setDetail(null); }}>Edit</Button>
                  <DeletePeerClassButton classId={detail.classId} onDeleted={()=>{ setDetail(null); load(); }} />
                </>
              ) : user && (detail.participants||[]).includes(user.userId) ? (
                <Button size="sm" variant="outline" onClick={async()=>{ if(!user) return; await peerApi.unjoin(detail.classId, user.userId); toast.success('Unjoined'); setDetail(null); await load(); }}>Unjoin</Button>
              ) : user ? (
                <Button size="sm" onClick={async()=>{ await join(detail.classId); setDetail(null); }}>Join</Button>
              ) : null}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={openRequest} onClose={() => setOpenRequest(false)} title={editingReq ? "Edit request" : "Request a class"}>
        <form onSubmit={handleSubmitReq(async (values) => {
          if (!user) return;
          try {
            if (editingReq) {
              await peerRequestApi.update(editingReq.requestId, {
                title: values.title,
                courseModule: values.courseModule,
                description: values.description,
                fromDate: values.fromDate,
                toDate: values.toDate,
                mode: values.mode,
                location: values.location,
                fee: values.fee ? Number(values.fee) : undefined,
              } as any);
              toast.success('Request updated');
            } else {
              await peerRequestApi.create({
                requesterId: user.userId,
                requesterName: user.name,
                title: values.title,
                department: user.department,
                courseModule: values.courseModule,
                description: values.description,
                fromDate: values.fromDate,
                toDate: values.toDate,
                mode: values.mode,
                location: values.location,
                fee: values.fee ? Number(values.fee) : undefined,
              });
              toast.success('Request posted');
            }
            resetReq({ title: '', courseModule: (user.courses||[])[0], description: '', fromDate: '', toDate: '', fee: '' });
            setOpenRequest(false);
            setEditingReq(null);
            await load();
          } catch {
            toast.error('Failed to post request');
          }
        })} className="space-y-3">
          <Input {...registerReq('title')} placeholder="Title" />
          {errorsReq.title && <p className="text-sm text-red-600">{errorsReq.title.message}</p>}
          <ComboBox options={courseOptions} value={reqCourseModule || ""} onChange={(v) => setValueReq('courseModule', v)} onSearch={async (q) => {
            const res = await coursesApi.search(q).catch(() => [] as CourseModule[]);
            setCourseOptions(res.map((m) => `${m.code} - ${m.title}`));
          }} placeholder="Search course..." />
          <Textarea {...registerReq('description')} placeholder="Describe what you need" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-muted mb-1">From date</label>
              <Input type="date" {...registerReq('fromDate')} />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">To date</label>
              <Input type="date" {...registerReq('toDate')} />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Fee (optional)</label>
              <Input type="number" min="0" {...registerReq('fee')} placeholder="Fee (optional)" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{(watchReq('mode') || 'physical') === 'virtual' ? 'Meeting Link' : 'Preferred Location'}</label>
              <Input {...registerReq('location')} placeholder={(watchReq('mode') || 'physical') === 'virtual' ? 'Paste meeting link' : 'Enter location'} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Mode</label>
              <div className="flex items-center gap-4 h-10">
                <label className="inline-flex items-center gap-1 text-sm">
                  <input type="radio" value="physical" {...registerReq('mode')} defaultChecked /> Physical
                </label>
                <label className="inline-flex items-center gap-1 text-sm">
                  <input type="radio" value="virtual" {...registerReq('mode')} /> Virtual
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpenRequest(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmittingReq}>{isSubmittingReq ? 'Posting...' : 'Post Request'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AcceptRequestButton({ request, tutorId, onAccepted }: { request: PeerRequest; tutorId: string; onAccepted: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ date: string; time: string; location: string }>({});
  return (
    <>
      <Button className="mt-2" onClick={(e)=>{ e.stopPropagation(); setOpen(true); }}>Accept & Schedule</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Schedule this request">
        <form onSubmit={handleSubmit(async (values) => {
          try {
            await peerRequestApi.accept(request.requestId, { tutorId, ...values });
            reset({ date: '', time: '', location: '' });
            setOpen(false);
            onAccepted();
            toast.success('Scheduled and moved to Group Study');
          } catch {
            toast.error('Failed to schedule');
          }
        })} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input type="date" {...register('date', { required: true })} />
            <Input type="time" {...register('time', { required: true })} />
            <Input placeholder="Location" {...register('location', { required: true })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Scheduling...' : 'Schedule'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function DeletePeerClassButton({ classId, onDeleted }: { classId: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Button variant="danger" size="sm" onClick={(e)=>{ e.stopPropagation(); setOpen(true); }}>Delete</Button>
      <Modal open={open} onClose={()=> setOpen(false)} title="Delete class?">
        <div className="space-y-3">
          <p className="text-sm text-muted">This will permanently remove the class. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> setOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async()=>{ setLoading(true); try { await peerApi.remove(classId); toast.success('Deleted'); setOpen(false); onDeleted(); } catch { toast.error('Failed to delete'); } finally { setLoading(false); } }}
              disabled={loading}
            >{loading ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}


