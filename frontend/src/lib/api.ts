const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  return res.json();
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
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const data = await res.json();
      if (data && typeof data.message === 'string') msg = data.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
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
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const data = await res.json();
      if (data && typeof data.message === 'string') msg = data.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const data = await res.json();
      if (data && typeof data.message === 'string') msg = data.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export type AuthUser = { userId: string; name: string; department: string; batch: string; courses: string[]; avatarUrl?: string };
export const authApi = {
  register: (payload: { name: string; email: string; password: string; department: string; batch: string; registrationNumber: string; indexNumber: string }) =>
    apiPost<{ token: string; user: AuthUser }>(`/auth/register`, payload),
  login: (payload: { email: string; password: string }) =>
    apiPost<{ token: string; user: AuthUser }>(`/auth/login`, payload),
  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    apiPost<{ message: string }>(`/auth/change-password`, payload),
};

export const metaApi = {
  departments: () => apiGet<string[]>('/meta/departments'),
  batches: () => apiGet<string[]>('/meta/batches'),
  courses: (department: string) => apiGet<string[]>(`/meta/courses?department=${encodeURIComponent(department)}`),
};

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
  answers: { answerId: string; answeredBy: string; answeredById?: string; answeredByAvatarUrl?: string; text: string; attachments: string[]; date: string; replies?: { replyId: string; repliedBy: string; repliedById?: string; repliedByAvatarUrl?: string; text: string; date: string; attachments?: string[] }[] }[];
  date: string;
  pinnedAnswerIds?: string[];
};

export const questionsApi = {
  list: (params?: { courseModule?: string; q?: string; page?: number; limit?: number; sort?: string }) => {
    const q = new URLSearchParams();
    if (params?.courseModule) q.set('courseModule', params.courseModule);
    if (params?.q) q.set('q', params.q);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sort) q.set('sort', params.sort);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiGet<{ items: Question[]; page: number; limit: number; total: number; pages: number }>(`/questions${suffix}`);
  },
  get: (id: string) => apiGet<Question>(`/questions/${id}`),
  create: (payload: Omit<Question, 'questionId' | 'answers' | 'date'> & { attachments?: string[] }) =>
    apiPost<Question>('/questions', payload),
  addAnswer: (id: string, payload: { answeredBy?: string; answeredById?: string; text: string; attachments?: string[] }) =>
    apiPost<Question>(`/questions/${id}/answers`, payload),
  update: (id: string, payload: { title?: string; description?: string; attachments?: string[] }) =>
    apiPut<Question>(`/questions/${id}`, payload),
  remove: (id: string) => apiDelete<{ ok: true }>(`/questions/${id}`),
  removeAnswer: (id: string, answerId: string) => apiDelete<{ ok: true }>(`/questions/${id}/answers/${answerId}`),
  updateAnswer: (id: string, answerId: string, payload: { text?: string; attachments?: string[] }) =>
    apiPut<Question>(`/questions/${id}/answers/${answerId}`, payload),
  pinAnswer: (id: string, answerId: string) => apiPost<{ ok: true; pinnedAnswerIds: string[] }>(`/questions/${id}/answers/${answerId}/pin`, {}),
  addReply: (id: string, answerId: string, payload: { repliedBy?: string; repliedById?: string; text: string; attachments?: string[] }) =>
    apiPost<Question>(`/questions/${id}/answers/${answerId}/replies`, payload),
  removeReply: (id: string, answerId: string, replyId: string) =>
    apiDelete<{ ok: true }>(`/questions/${id}/answers/${answerId}/replies/${replyId}`),
  updateReply: (id: string, answerId: string, replyId: string, payload: { text?: string; attachments?: string[] }) =>
    apiPut<Question>(`/questions/${id}/answers/${answerId}/replies/${replyId}`, payload),
};

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
  list: (params?: { page?: number; limit?: number; sort?: string; q?: string; courseModule?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sort) q.set('sort', params.sort);
    if (params?.q) q.set('q', params.q);
    if (params?.courseModule) q.set('courseModule', params.courseModule);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiGet<{ items: GroupStudy[]; page: number; limit: number; total: number; pages: number }>(`/groups${suffix}`);
  },
  get: (id: string) => apiGet<GroupStudy>(`/groups/${id}`),
  create: (payload: Omit<GroupStudy, 'groupId' | 'participants'> & { invitees?: string[]; batches?: string[]; hosts?: string[] }) => apiPost<GroupStudy>('/groups', payload),
  update: (id: string, payload: Partial<GroupStudy> & { invitees?: string[]; batches?: string[]; hosts?: string[] }) => apiPut<GroupStudy>(`/groups/${id}`, payload),
  join: (id: string, userId: string) => apiPost<GroupStudy>(`/groups/${id}/join`, { userId }),
  unjoin: (id: string, userId: string) => apiPost<GroupStudy>(`/groups/${id}/unjoin`, { userId }),
  remove: (id: string) => apiDelete<{ ok: true }>(`/groups/${id}`),
  messages: {
    list: (id: string) => apiGet<{ items: { messageId: string; groupId: string; userId: string; userName?: string; userAvatarUrl?: string; text?: string; attachments?: string[]; createdAt: string }[] }>(`/groups/${id}/messages`),
    create: (id: string, payload: { text?: string; attachments?: string[] }) => apiPost(`/groups/${id}/messages`, payload),
  }
};

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
  list: (params?: { page?: number; limit?: number; sort?: string; q?: string; courseModule?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.sort) q.set('sort', params.sort);
    if (params?.q) q.set('q', params.q);
    if (params?.courseModule) q.set('courseModule', params.courseModule);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiGet<{ items: PeerClass[]; page: number; limit: number; total: number; pages: number }>(`/peer-teaching${suffix}`);
  },
  get: (id: string) => apiGet<PeerClass>(`/peer-teaching/${id}`),
  create: (payload: Omit<PeerClass, 'classId' | 'participants'>) => apiPost<PeerClass>('/peer-teaching', payload),
  join: (id: string, userId: string) => apiPost<PeerClass>(`/peer-teaching/${id}/join`, { userId }),
  unjoin: (id: string, userId: string) => apiPost<PeerClass>(`/peer-teaching/${id}/unjoin`, { userId }),
  update: (id: string, payload: Partial<PeerClass>) => apiPut<PeerClass>(`/peer-teaching/${id}`, payload),
  remove: (id: string) => apiDelete<{ ok: true }>(`/peer-teaching/${id}`),
};

export const usersApi = {
  upsert: (payload: { userId: string; name: string; department: string; batch: string; courses: string[] }) =>
    apiPost('/users', payload),
  get: (id: string) => apiGet(`/users/${id}`),
  search: (q: string) => apiGet<{ userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string; batch?: string }[]>(`/users?q=${encodeURIComponent(q)}`),
  me: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
    return apiGet<{ userId: string; name: string; email: string; department: string; batch: string; courses: string[]; registrationNumber?: string; indexNumber?: string }>(`/users/me`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
  },
  updateMe: (payload: { currentPassword: string; name?: string; department?: string; batch?: string; registrationNumber?: string; indexNumber?: string; avatarUrl?: string | null }) =>
    apiPost(`/users/me`, payload),
};

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
  // Enriched fields
  acceptedByName?: string;
  acceptedByAvatarUrl?: string;
  acceptedByIndexNumber?: string;
  acceptedByRegistrationNumber?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledLocation?: string;
};

export const peerRequestApi = {
  listOpen: (status: 'open' | 'scheduled' | 'closed' | string = 'open', opts?: { q?: string; courseModule?: string }) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (opts?.q) q.set('q', opts.q);
    if (opts?.courseModule) q.set('courseModule', opts.courseModule);
    return apiGet<PeerRequest[]>(`/peer-requests?${q.toString()}`);
  },
  get: (id: string) => apiGet<PeerRequest & { requesterDetail?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string }; participantsDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string }[]; hostDetails?: { userId: string; name: string; avatarUrl?: string; registrationNumber?: string; indexNumber?: string }[] }>(`/peer-requests/${id}`),
  create: (payload: Omit<PeerRequest, 'requestId' | 'status' | 'acceptedBy' | 'groupId'>) => apiPost<PeerRequest>('/peer-requests', payload),
  join: (id: string, payload: { userId: string }) => apiPost<PeerRequest>(`/peer-requests/${id}/join`, payload),
  unjoin: (id: string, payload: { userId: string }) => apiPost<PeerRequest>(`/peer-requests/${id}/unjoin`, payload),
  accept: (id: string, payload: { tutorId: string; date: string; time: string; location: string }) =>
    apiPost(`/peer-requests/${id}/accept`, payload),
  update: (id: string, payload: Partial<PeerRequest>) => apiPut<PeerRequest>(`/peer-requests/${id}`, payload),
  cancel: (id: string) => apiPost<{ ok: true }>(`/peer-requests/${id}/cancel`, {}),
  reschedule: (id: string, payload: { date?: string; time?: string; location?: string }) => apiPost<{ ok: true }>(`/peer-requests/${id}/schedule`, payload),
  cancelSchedule: (id: string) => apiPost<{ ok: true }>(`/peer-requests/${id}/schedule/cancel`, {}),
};

export type CourseModule = { code: string; title: string; department: string; semester: number; credit?: number };

export const coursesApi = {
  list: (params?: { department?: string; semester?: number; q?: string }) => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.semester) q.set('semester', String(params.semester));
    if (params?.q) q.set('q', params.q);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiGet<CourseModule[]>(`/courses${suffix}`);
  },
  search: (query: string) => apiGet<CourseModule[]>(`/courses?q=${encodeURIComponent(query)}`),
};

export const uploadApi = {
  upload: async (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const token = typeof window !== 'undefined' ? localStorage.getItem('tl_token') : undefined;
    const res = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      } as Record<string, string>,
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json() as Promise<{ files: { url: string; filename: string; mimetype: string; size: number }[] }>;
  },
};

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
  list: (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.unread) q.set('unread', 'true');
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiGet<{ items: NotificationItem[]; page: number; limit: number; total: number; pages: number }>(`/notifications${suffix}`);
  },
  mark: (id: string) => apiPost<NotificationItem>(`/notifications/${id}/mark`, {}),
  markAll: () => apiPost<{ ok: true }>(`/notifications/mark-all`, {}),
  remove: (id: string) => apiDelete<{ ok: true }>(`/notifications/${id}`),
};


