const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try { return JSON.parse(text) as T; } catch { return {} as T; }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return safeJson<T>(res);
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const text = await res.text();
      if (text) {
        const data = JSON.parse(text);
        if (data && typeof data.message === 'string') msg = data.message;
      }
    } catch {}
    throw new Error(msg);
  }
  return safeJson<T>(res);
}

export async function apiPut<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const text = await res.text();
      if (text) {
        const data = JSON.parse(text);
        if (data && typeof data.message === 'string') msg = data.message;
      }
    } catch {}
    throw new Error(msg);
  }
  return safeJson<T>(res);
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const text = await res.text();
      if (text) {
        const data = JSON.parse(text);
        if (data && typeof data.message === 'string') msg = data.message;
      }
    } catch {}
    throw new Error(msg);
  }
  return safeJson<T>(res);
}

function fromSpringPage<T, R>(
  page: { content: T[]; number: number; size: number; totalElements: number; totalPages: number },
  mapper: (item: T) => R
): { items: R[]; page: number; limit: number; total: number; pages: number } {
  return {
    items: (page.content || []).map(mapper),
    page: (page.number || 0) + 1,
    limit: page.size || 20,
    total: page.totalElements || 0,
    pages: page.totalPages || 1,
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'STUDENT';
export type AuthUser = { userId: string; name: string; department: string; batch: string; role?: UserRole; courses: string[]; avatarUrl?: string };

export const authApi = {
  register: async (payload: { name: string; email: string; password: string; department: string; batch: string; registrationNumber: string; indexNumber: string }) => {
    const flat = await apiPost<{ userId: string; name: string; email: string; department: string; batch: string; role: string; token: string }>(`/auth/register`, payload);
    return { token: flat.token, user: { userId: flat.userId, name: flat.name, department: flat.department, batch: flat.batch, role: flat.role === 'ADMIN' ? 'ADMIN' : 'STUDENT', courses: [] as string[] } as AuthUser };
  },
  login: async (payload: { email: string; password: string }) => {
    const flat = await apiPost<{ userId: string; name: string; email: string; department: string; batch: string; role: string; token: string }>(`/auth/login`, payload);
    return { token: flat.token, user: { userId: flat.userId, name: flat.name, department: flat.department, batch: flat.batch, role: flat.role === 'ADMIN' ? 'ADMIN' : 'STUDENT', courses: [] as string[] } as AuthUser };
  },
  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    apiPost<{ message: string }>(`/auth/change-password`, payload),
};

// ─── Meta ────────────────────────────────────────────────────────────────────

export const metaApi = {
  departments: () => apiGet<string[]>('/meta/departments'),
  batches: () => apiGet<string[]>('/meta/batches'),
  courses: (department?: string) => {
    const qs = department ? `?department=${encodeURIComponent(department)}` : '';
    return apiGet<{ courseCode: string; title: string }[]>(`/courses${qs}`).then(list => list.map(c => c.courseCode));
  },
};

// ─── Q&A ─────────────────────────────────────────────────────────────────────

type _BReply = { replyId: string; answerId: string; authorId: string; content: string; createdAt: string; updatedAt: string };
type _BAnswer = { answerId: string; questionId: string; content: string; authorId: string; accepted: boolean; upvoteCount: number; userVote: 'UP' | 'DOWN' | null; attachmentUrls: string[]; replies: _BReply[]; createdAt: string; updatedAt: string };
type _BQuestion = { questionId: string; title: string; body: string; authorId: string; courseCode: string; tags: string; status: string; answerCount: number; upvoteCount: number; userVote: 'UP' | 'DOWN' | null; bookmarked: boolean | null; attachmentUrls: string[]; createdAt: string; answers: _BAnswer[] };

function _mapReply(r: _BReply) {
  return { replyId: r.replyId, repliedBy: r.authorId, repliedById: r.authorId, text: r.content, date: r.createdAt, attachments: [] as string[] };
}

function _mapAnswer(a: _BAnswer) {
  return {
    answerId: a.answerId, answeredBy: a.authorId, answeredById: a.authorId,
    text: a.content, attachments: (a.attachmentUrls || []) as string[],
    upvoteCount: a.upvoteCount ?? 0, userVote: a.userVote ?? null,
    date: a.createdAt, replies: (a.replies || []).map(_mapReply),
  };
}

function _mapQuestion(q: _BQuestion): Question {
  return {
    questionId: q.questionId,
    userId: q.authorId,
    userName: q.authorId,
    department: '',
    batch: '',
    courseModule: q.courseCode,
    title: q.title,
    description: q.body,
    attachments: (q.attachmentUrls || []),
    upvoteCount: q.upvoteCount ?? 0,
    userVote: q.userVote ?? null,
    bookmarked: q.bookmarked ?? false,
    answers: (q.answers || []).map(_mapAnswer),
    date: q.createdAt,
    pinnedAnswerIds: [],
  };
}

export type Question = {
  questionId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  department: string;
  batch: string;
  courseModule: string;
  title: string;
  description: string;
  attachments: string[];
  upvoteCount?: number;
  userVote?: 'UP' | 'DOWN' | null;
  bookmarked?: boolean;
  answers: {
    answerId: string; answeredBy: string; answeredById?: string; answeredByAvatarUrl?: string;
    text: string; attachments: string[]; upvoteCount?: number; userVote?: 'UP' | 'DOWN' | null;
    date: string;
    replies?: { replyId: string; repliedBy: string; repliedById?: string; repliedByAvatarUrl?: string; text: string; date: string; attachments?: string[] }[];
  }[];
  date: string;
  pinnedAnswerIds?: string[];
};

export const questionsApi = {
  list: async (params?: { courseModule?: string; q?: string; page?: number; limit?: number; sort?: string }) => {
    const qs = new URLSearchParams();
    if (params?.courseModule) qs.set('courseCode', params.courseModule);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const list = await apiGet<_BQuestion[]>(`/questions${suffix}`);
    return { items: list.map(_mapQuestion), page: 1, limit: list.length, total: list.length, pages: 1 };
  },
  get: (id: string) => apiGet<_BQuestion>(`/questions/${id}`).then(_mapQuestion),
  create: (payload: Omit<Question, 'questionId' | 'answers' | 'date'> & { attachments?: string[] }) =>
    apiPost<_BQuestion>('/questions', {
      title: payload.title,
      body: payload.description,
      courseCode: payload.courseModule,
      tags: '',
    }).then(_mapQuestion),
  addAnswer: (id: string, payload: { answeredBy?: string; answeredById?: string; text: string; attachments?: string[] }) =>
    apiPost<any>(`/questions/${id}/answers`, { content: payload.text }),
  update: (id: string, payload: { title?: string; description?: string; attachments?: string[] }) =>
    apiPut<_BQuestion>(`/questions/${id}`, { title: payload.title, body: payload.description }).then(_mapQuestion),
  remove: (id: string) => apiDelete<{ ok: true }>(`/questions/${id}`),
  removeAnswer: (id: string, answerId: string) => apiDelete<{ ok: true }>(`/questions/${id}/answers/${answerId}`),
  updateAnswer: (id: string, answerId: string, payload: { text?: string; attachments?: string[] }) =>
    apiPut<any>(`/questions/${id}/answers/${answerId}`, { content: payload.text }),
  pinAnswer: (id: string, answerId: string) =>
    apiPost<any>(`/questions/${id}/answers/${answerId}/accept`, {}),
  // Votes (toggle: sending same type again removes the vote)
  vote: (id: string, voteType: 'UP' | 'DOWN') =>
    apiPost<_BQuestion>(`/questions/${id}/vote`, { type: voteType }).then(_mapQuestion),
  voteAnswer: (id: string, answerId: string, voteType: 'UP' | 'DOWN') =>
    apiPost<any>(`/questions/${id}/answers/${answerId}/vote`, { type: voteType }),
  // Bookmarks
  bookmark: (id: string) => apiPost<void>(`/questions/${id}/bookmark`, {}),
  removeBookmark: (id: string) => apiDelete<void>(`/questions/${id}/bookmark`),
  bookmarked: () => apiGet<_BQuestion[]>('/questions/bookmarked').then(list => list.map(_mapQuestion)),
  // Replies
  addReply: (id: string, answerId: string, payload: { repliedBy?: string; repliedById?: string; text: string; attachments?: string[] }) =>
    apiPost<any>(`/questions/${id}/answers/${answerId}/replies`, { content: payload.text }),
  removeReply: (id: string, answerId: string, replyId: string) =>
    apiDelete<{ ok: true }>(`/questions/${id}/answers/${answerId}/replies/${replyId}`),
  updateReply: (id: string, answerId: string, replyId: string, payload: { text?: string; attachments?: string[] }) =>
    apiPut<any>(`/questions/${id}/answers/${answerId}/replies/${replyId}`, { content: payload.text }),
};

// ─── Groups ──────────────────────────────────────────────────────────────────

type _BGroup = {
  groupId: string; title: string; description: string; creatorId: string; courseCode: string;
  scheduledDate: string; scheduledTime: string; location: string; mode: string; status: string;
  maxParticipants: number; participantCount: number; createdAt: string;
  participants: { userId: string; role: string }[];
};

function _mapGroup(g: _BGroup): GroupStudy {
  const participants = (g.participants || []).map(p => p.userId);
  const hosts = (g.participants || []).filter(p => p.role === 'HOST').map(p => p.userId);
  return {
    groupId: g.groupId,
    creatorId: g.creatorId,
    title: g.title,
    department: '',
    courseModule: g.courseCode,
    description: g.description,
    date: g.scheduledDate,
    time: g.scheduledTime,
    location: g.location,
    participants,
    hosts,
    mode: (g.mode || 'PHYSICAL').toLowerCase() as 'virtual' | 'physical',
  };
}

export type GroupStudy = {
  groupId: string;
  creatorId: string;
  title: string;
  department: string;
  courseModule: string;
  description: string;
  date: string;
  time: string;
  location: string;
  participants: string[];
  hosts?: string[];
  mode?: 'virtual' | 'physical';
  participantsDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string }[];
  hostDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string }[];
};

export const groupsApi = {
  list: async (params?: { page?: number; limit?: number; sort?: string; q?: string; courseModule?: string }) => {
    const qs = new URLSearchParams();
    if (params?.courseModule) qs.set('courseCode', params.courseModule);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const list = await apiGet<_BGroup[]>(`/groups${suffix}`);
    return { items: list.map(_mapGroup), page: 1, limit: list.length, total: list.length, pages: 1 };
  },
  get: (id: string) => apiGet<_BGroup>(`/groups/${id}`).then(_mapGroup),
  create: (payload: Omit<GroupStudy, 'groupId' | 'participants'> & { invitees?: string[]; batches?: string[]; hosts?: string[] }) =>
    apiPost<_BGroup>('/groups', {
      title: payload.title,
      description: payload.description,
      courseCode: payload.courseModule,
      scheduledDate: payload.date,
      scheduledTime: payload.time,
      location: payload.location,
      mode: (payload.mode || 'physical').toUpperCase(),
      maxParticipants: 20,
    }).then(_mapGroup),
  update: (id: string, payload: Partial<GroupStudy> & { invitees?: string[]; batches?: string[]; hosts?: string[] }) =>
    apiPut<_BGroup>(`/groups/${id}`, {
      title: payload.title,
      description: payload.description,
      courseCode: payload.courseModule,
      scheduledDate: payload.date,
      scheduledTime: payload.time,
      location: payload.location,
      mode: payload.mode ? payload.mode.toUpperCase() : undefined,
    }).then(_mapGroup),
  join: (id: string, _userId: string) => apiPost<GroupStudy>(`/groups/${id}/join`, {}),
  unjoin: (id: string, _userId: string) => apiPost<GroupStudy>(`/groups/${id}/leave`, {}),
  remove: (id: string) => apiDelete<{ ok: true }>(`/groups/${id}`),
  messages: {
    list: async (id: string) => {
      const page = await apiGet<any>(`/messages/groups/${id}`);
      const items = (page.content || []).map((m: any) => ({
        messageId: m.messageId,
        groupId: m.groupId,
        userId: m.authorId,
        text: m.content,
        attachmentUrl: m.attachmentUrl ?? null,
        createdAt: m.createdAt,
      }));
      return { items };
    },
    create: (id: string, payload: { text?: string; attachmentUrl?: string }) =>
      apiPost(`/messages/groups/${id}`, { content: payload.text, attachmentUrl: payload.attachmentUrl }),
  },
};

// ─── PeerClass (Offered Sessions → peer-offers) ───────────────────────────────

type _BOffer = { offerId: string; tutorId: string; courseCode: string; description: string; status: string; createdAt: string };

function _mapOffer(o: _BOffer): PeerClass {
  return {
    classId: o.offerId,
    tutorId: o.tutorId,
    creatorId: o.tutorId,
    title: `${o.courseCode} Peer Session`,
    department: '',
    courseModule: o.courseCode,
    description: o.description,
    date: (o.createdAt || '').split('T')[0],
    time: '',
    participants: [],
    hosts: [o.tutorId],
  };
}

export type PeerClass = {
  classId: string;
  tutorId: string;
  creatorId: string;
  title: string;
  department: string;
  courseModule: string;
  description: string;
  fromDate?: string;
  toDate?: string;
  date: string;
  time: string;
  location?: string;
  mode?: 'virtual' | 'physical';
  fee?: number;
  participants: string[];
  hosts?: string[];
  participantsDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string }[];
  hostDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string }[];
  creatorName?: string;
  creatorAvatarUrl?: string;
  creatorIndexNumber?: string;
  creatorRegistrationNumber?: string;
};

export const peerApi = {
  list: async (params?: { page?: number; limit?: number; sort?: string; q?: string; courseModule?: string }) => {
    const qs = new URLSearchParams();
    if (params?.courseModule) qs.set('courseCode', params.courseModule);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const list = await apiGet<_BOffer[]>(`/peer-offers${suffix}`);
    const items = list.map(_mapOffer);
    return { items, page: 1, limit: items.length, total: items.length, pages: 1 };
  },
  get: (_id: string): Promise<PeerClass> => Promise.reject(new Error('Not implemented')),
  create: (payload: Omit<PeerClass, 'classId' | 'participants'>) =>
    apiPost<_BOffer>('/peer-offers', {
      courseCode: payload.courseModule,
      description: payload.description,
    }).then(_mapOffer),
  join: (_id: string, _userId: string): Promise<PeerClass> => Promise.resolve({} as PeerClass),
  unjoin: (_id: string, _userId: string): Promise<PeerClass> => Promise.resolve({} as PeerClass),
  update: (id: string, payload: Partial<PeerClass>) =>
    apiPut<_BOffer>(`/peer-offers/${id}`, { status: 'OPEN' }).then(_mapOffer),
  remove: (_id: string): Promise<{ ok: true }> => Promise.reject(new Error('Not implemented')),
};

// ─── PeerRequest ─────────────────────────────────────────────────────────────

type _BRequest = {
  requestId: string; requesterId: string; courseCode: string; topic: string;
  description: string; status: string; createdAt: string;
  applications: { applicationId: string; applicantId: string; message: string; status: string; appliedAt: string }[];
};

function _mapRequest(r: _BRequest): PeerRequest {
  return {
    requestId: r.requestId,
    requesterId: r.requesterId,
    requesterName: r.requesterId,
    title: r.topic,
    department: '',
    courseModule: r.courseCode,
    description: r.description,
    fromDate: (r.createdAt || '').split('T')[0],
    toDate: (r.createdAt || '').split('T')[0],
    status: (r.status || 'OPEN').toLowerCase() as 'open' | 'scheduled' | 'closed',
    participants: [],
  };
}

export type PeerRequest = {
  requestId: string;
  requesterId: string;
  requesterName: string;
  title: string;
  department: string;
  courseModule: string;
  description: string;
  fromDate: string;
  toDate: string;
  mode?: 'virtual' | 'physical';
  location?: string;
  fee?: number;
  status: 'open' | 'scheduled' | 'closed';
  acceptedBy?: string;
  groupId?: string;
  participants?: string[];
  hosts?: string[];
  acceptedByName?: string;
  acceptedByAvatarUrl?: string;
  acceptedByIndexNumber?: string;
  acceptedByRegistrationNumber?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledLocation?: string;
};

export const peerRequestApi = {
  listOpen: async (status: string = 'open', opts?: { q?: string; courseModule?: string }) => {
    const qs = new URLSearchParams();
    if (opts?.courseModule) qs.set('courseCode', opts.courseModule);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const list = await apiGet<_BRequest[]>(`/peer-requests${suffix}`);
    return list.map(_mapRequest);
  },
  get: (id: string) => apiGet<_BRequest>(`/peer-requests/${id}`).then(r => _mapRequest(r) as any),
  create: (payload: Omit<PeerRequest, 'requestId' | 'status' | 'acceptedBy' | 'groupId'>) =>
    apiPost<_BRequest>('/peer-requests', {
      courseCode: payload.courseModule,
      topic: payload.title,
      description: payload.description,
    }).then(_mapRequest),
  join: (id: string, payload: { userId: string }) =>
    apiPost<_BRequest>(`/peer-requests/${id}/apply`, { message: '' }).then(_mapRequest),
  unjoin: (_id: string, _payload: { userId: string }): Promise<PeerRequest> => Promise.resolve({} as PeerRequest),
  accept: (id: string, payload: { tutorId: string; date: string; time: string; location: string }) =>
    apiPost(`/peer-requests/${id}/apply`, {
      message: `Accept & Schedule: ${payload.date} ${payload.time} @ ${payload.location}`,
    }),
  update: (id: string, payload: Partial<PeerRequest>) =>
    apiPut<_BRequest>(`/peer-requests/${id}`, { status: (payload.status || 'open').toUpperCase() }).then(_mapRequest),
  cancel: (id: string) => apiPost<{ ok: true }>(`/peer-requests/${id}/cancel`, {}),
  reschedule: (_id: string, _payload: { date?: string; time?: string; location?: string }): Promise<{ ok: true }> =>
    Promise.resolve({ ok: true }),
  cancelSchedule: (_id: string): Promise<{ ok: true }> => Promise.resolve({ ok: true }),
};

// ─── Courses ─────────────────────────────────────────────────────────────────

export type CourseModule = { code: string; title: string; department: string; semester: number; credits?: number; description?: string; preReqs?: string };

export const coursesApi = {
  list: (params?: { department?: string; semester?: number; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.department) qs.set('department', params.department);
    if (params?.semester) qs.set('semester', String(params.semester));
    if (params?.q) qs.set('q', params.q);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiGet<any[]>(`/courses${suffix}`).then(list =>
      list.map(c => ({ code: c.courseCode, title: c.title, department: c.department, semester: c.semester, credits: c.credits, description: c.description, preReqs: c.preReqs }) as CourseModule)
    );
  },
  search: (query: string) => apiGet<any[]>(`/courses?q=${encodeURIComponent(query)}`).then(list =>
    list.map(c => ({ code: c.courseCode, title: c.title, department: c.department, semester: c.semester }) as CourseModule)
  ),
  create: (payload: { courseCode: string; title: string; description?: string; department: string; semester: number; credits?: number; preReqs?: string }) =>
    apiPost<CourseModule>('/courses', payload),
  update: (courseCode: string, payload: { title?: string; description?: string; department?: string; semester?: number; credits?: number; preReqs?: string }) =>
    apiPut<CourseModule>(`/courses/${encodeURIComponent(courseCode)}`, payload),
  remove: (courseCode: string) => apiDelete<void>(`/courses/${encodeURIComponent(courseCode)}`),
};

// ─── Files (file-service → MinIO/S3) ─────────────────────────────────────────

export type FileUploadResult = { key: string; url: string; contentType: string; size: number };

export const filesApi = {
  upload: async (file: File, folder = 'uploads'): Promise<FileUploadResult> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/files/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } as Record<string, string>,
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json() as Promise<FileUploadResult>;
  },
  delete: (key: string) =>
    apiDelete<void>(`/files?key=${encodeURIComponent(key)}`),
  presigned: async (key: string, expiryMinutes = 60): Promise<string> => {
    const data = await apiGet<{ url: string }>(
      `/files/presigned?key=${encodeURIComponent(key)}&expiryMinutes=${expiryMinutes}`
    );
    return data.url;
  },
};

// ─── Uploads (legacy — kept for backward compat) ─────────────────────────────

export const uploadApi = {
  upload: async (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
    const res = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } as Record<string, string>,
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json() as Promise<{ files: { url: string; filename: string; mimetype: string; size: number }[] }>;
  },
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export type AdminUser = { userId: string; name: string; email: string; department: string; batch: string; role: UserRole; registrationNumber?: string; indexNumber?: string };

export const adminApi = {
  listUsers: async (q?: string, page = 0, size = 50) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    qs.set('page', String(page));
    qs.set('size', String(size));
    const data = await apiGet<any>(`/users?${qs.toString()}`);
    const items: AdminUser[] = (data.content || []).map((u: any) => ({
      userId: u.userId, name: u.name, email: u.email, department: u.department,
      batch: u.batch, role: u.role === 'ADMIN' ? 'ADMIN' : 'STUDENT', registrationNumber: u.registrationNumber, indexNumber: u.indexNumber,
    }));
    return { items, total: data.totalElements || 0, pages: data.totalPages || 1 };
  },
  updateUser: (userId: string, payload: { name?: string; department?: string; batch?: string; registrationNumber?: string; indexNumber?: string; role?: UserRole }) =>
    apiPut<AdminUser>(`/users/${userId}`, payload),
  updateUserRole: (userId: string, role: UserRole) =>
    apiPut<AdminUser>(`/users/${userId}/role`, { role }),
};

// ─── Notifications ───────────────────────────────────────────────────────────

type _BNotification = {
  notificationId: string; type: string; title: string; message: string;
  referenceType: string; referenceId: string; read: boolean; createdAt: string;
};

const _notifTypeMap: Record<string, string> = {
  GROUP_JOIN: 'group_join',
  QUESTION_ANSWERED: 'question_answer',
  PEER_APPLICATION: 'request_join',
  PEER_ACCEPTED: 'request_accept',
  SESSION_SCHEDULED: 'session_scheduled',
  SYSTEM: 'system',
};

function _mapNotification(n: _BNotification): NotificationItem {
  const data: Record<string, any> = {};
  if (n.referenceType === 'GROUP') data.groupId = n.referenceId;
  else if (n.referenceType === 'QUESTION') data.questionId = n.referenceId;
  else if (n.referenceType === 'PEER_REQUEST') data.requestId = n.referenceId;
  else if (n.referenceType === 'SESSION') data.sessionId = n.referenceId;
  return {
    notificationId: n.notificationId,
    userId: '',
    type: _notifTypeMap[n.type] || (n.type || '').toLowerCase(),
    title: n.title,
    body: n.message,
    data,
    read: n.read,
    createdAt: n.createdAt,
  };
}

export type NotificationItem = {
  notificationId: string;
  userId: string;
  type: 'group_join' | 'class_join' | 'request_accept' | 'request_join' | 'question_answer' | 'group_message' | string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
};

export const notificationsApi = {
  list: async (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    qs.set('page', String(Math.max(0, (params?.page || 1) - 1)));
    qs.set('size', String(params?.limit || 20));
    const page = await apiGet<any>(`/notifications?${qs.toString()}`);
    return fromSpringPage<_BNotification, NotificationItem>(page, _mapNotification);
  },
  unreadCount: () =>
    apiGet<{ count: number }>('/notifications/unread-count').then(r => r.count ?? 0),
  mark: (id: string) => apiPut<void>(`/notifications/${id}/read`, {}),
  markAll: () => apiPut<void>(`/notifications/read-all`, {}),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  upsert: (payload: { userId: string; name: string; department: string; batch: string; courses: string[] }) =>
    apiPost('/users', payload),
  get: (id: string) => apiGet(`/users/${id}`),
  search: (q: string) => apiGet<{ userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string }[]>(`/users?q=${encodeURIComponent(q)}`),
  me: () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('tl_user') : null;
    let userId: string | null = null;
    try { userId = stored ? JSON.parse(stored).userId : null; } catch {}
    if (!userId) return Promise.reject(new Error('Not authenticated'));
    return apiGet<{ userId: string; name: string; email: string; department: string; batch: string; courses: string[]; registrationNumber?: string; indexNumber?: string }>(`/users/${userId}`);
  },
  updateMe: (payload: { currentPassword?: string; name?: string; department?: string; batch?: string; registrationNumber?: string; indexNumber?: string; avatarUrl?: string | null }) => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('tl_user') : null;
    let userId: string | null = null;
    try { userId = stored ? JSON.parse(stored).userId : null; } catch {}
    if (!userId) return Promise.reject(new Error('Not authenticated'));
    return apiPut(`/users/${userId}`, payload);
  },
};
