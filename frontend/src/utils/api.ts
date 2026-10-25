import {
  AdminBuilding,
  Building,
  BuildingInput,
  City,
  ContactLink,
  ContactLinkInput,
  CurrentUser,
  Doc,
  ApartmentInput,
  BlockedUser,
  BuildingRole,
  Member,
  Issue,
  IssueDetail,
  IssueStatus,
  FeeScope,
  MyPayments,
  PaymentLogRow,
  PaymentMethod,
  PaymentSettings,
  PaymentsOverview,
  ResidentInput,
  UserPreview,
} from '../types/building';
import type { DevUser } from './devLogin';

const CONFIGURED_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
// Dev on a phone: the page is opened via the PC's LAN IP, where "localhost" would be the phone itself.
const API_URL = CONFIGURED_API_URL.replace(
  /^(https?:\/\/)localhost(?=[:/]|$)/,
  (_, scheme) => `${scheme}${window.location.hostname}`,
);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// While an admin previews the app as a building role, every request says so and the backend
// treats them as that role (honoured for real admins only, and it can only remove powers).
let viewAs: BuildingRole | null = null;
export function setViewAs(role: BuildingRole | null) {
  viewAs = role;
}

/** Dev only: the mock users the sign-in page can "sign in as" (no token needed; 404 unless the backend has DEV_LOGIN). */
export async function listDevUsers(): Promise<DevUser[]> {
  const res = await fetch(`${API_URL}/dev/users`);
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.json();
}

async function send(path: string, idToken: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // FormData sets its own multipart Content-Type (with boundary).
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${idToken}`,
      ...(viewAs ? { 'X-View-As': viewAs } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  return res;
}

async function request<T>(path: string, idToken: string, options: RequestInit = {}): Promise<T> {
  const res = await send(path, idToken, options);

  if (res.status === 204) return undefined as T;
  return res.json();
}

/**
 * Files live in private S3: the backend checks access and returns a 5-minute link, which is fetched
 * without our Authorization header (S3 would reject it).
 */
async function fetchPresigned(path: string, idToken: string): Promise<Blob> {
  const { url } = (await (await send(path, idToken)).json()) as { url: string };
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}

export const api = {
  /** Every building the user belongs to, each from their point of view. */
  getMyBuildings: (idToken: string) => request<Building[]>('/buildings/mine', idToken),

  /** Any signed-in user can create a building; they become its committee head or management company. */
  createBuilding: (idToken: string, dto: BuildingInput & { role: 'committee_head' | 'management_company' }) =>
    request<Building>('/buildings', idToken, { method: 'POST', body: JSON.stringify(dto) }),

  /** Names and pictures for pasted user IDs; with a building, flags existing and blocked members. */
  previewUsers: (idToken: string, ids: string[], buildingId?: string) =>
    request<UserPreview[]>('/buildings/preview-users', idToken, {
      method: 'POST',
      body: JSON.stringify({ ids, buildingId }),
    }),

  leaveBuilding: (idToken: string, buildingId: string) =>
    request<{ ok: boolean }>(`/buildings/${buildingId}/leave`, idToken, { method: 'POST' }),

  /** Building management (committee head / management company of the building, or admin). */
  manage: {
    addMembers: (idToken: string, buildingId: string, residents: ResidentInput[]) =>
      request<{ ok: boolean; added: number }>(`/buildings/${buildingId}/manage/members`, idToken, {
        method: 'POST',
        body: JSON.stringify({ residents }),
      }),

    setApartments: (idToken: string, buildingId: string, userId: string, apartments: ApartmentInput[]) =>
      request<{ ok: boolean }>(`/buildings/${buildingId}/manage/members/${userId}/apartments`, idToken, {
        method: 'PUT',
        body: JSON.stringify({ apartments }),
      }),

    removeMember: (idToken: string, buildingId: string, userId: string, block: boolean) =>
      request<{ ok: boolean }>(
        `/buildings/${buildingId}/manage/members/${userId}${block ? '?block=true' : ''}`,
        idToken,
        { method: 'DELETE' },
      ),

    listBlocks: (idToken: string, buildingId: string) =>
      request<BlockedUser[]>(`/buildings/${buildingId}/manage/blocks`, idToken),

    unblock: (idToken: string, buildingId: string, userId: string) =>
      request<{ ok: boolean }>(`/buildings/${buildingId}/manage/blocks/${userId}`, idToken, { method: 'DELETE' }),

    updateDetails: (
      idToken: string,
      buildingId: string,
      dto: { description?: string | null; entryCode?: string | null },
    ) =>
      request<Building>(`/buildings/${buildingId}/manage/details`, idToken, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),

    addContactLink: (idToken: string, buildingId: string, dto: ContactLinkInput) =>
      request<ContactLink>(`/buildings/${buildingId}/manage/contact-links`, idToken, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),

    removeContactLink: (idToken: string, buildingId: string, linkId: number) =>
      request<{ ok: boolean }>(`/buildings/${buildingId}/manage/contact-links/${linkId}`, idToken, {
        method: 'DELETE',
      }),

    /** Monthly fees: the budget, opening a month, marking paid, changing a fee. */
    payments: {
      overview: (idToken: string, buildingId: string) =>
        request<PaymentsOverview>(`/buildings/${buildingId}/manage/payments`, idToken),
      openMonth: (idToken: string, buildingId: string) =>
        request<PaymentsOverview>(`/buildings/${buildingId}/manage/payments/open`, idToken, { method: 'POST' }),
      markAllPaid: (idToken: string, buildingId: string) =>
        request<PaymentsOverview>(`/buildings/${buildingId}/manage/payments/mark-all-paid`, idToken, { method: 'POST' }),
      markPaid: (idToken: string, buildingId: string, apartmentId: number, method: PaymentMethod) =>
        request<PaymentsOverview>(`/buildings/${buildingId}/manage/payments/${apartmentId}/paid`, idToken, {
          method: 'POST',
          body: JSON.stringify({ method }),
        }),
      saveSettings: (idToken: string, buildingId: string, settings: PaymentSettings) =>
        request<PaymentsOverview>(`/buildings/${buildingId}/manage/payments/settings`, idToken, {
          method: 'PUT',
          body: JSON.stringify(settings),
        }),
      log: (idToken: string, buildingId: string) =>
        request<PaymentLogRow[]>(`/buildings/${buildingId}/manage/payments/log`, idToken),
      changeFee: (idToken: string, buildingId: string, apartmentId: number, amount: number, scope: FeeScope) =>
        request<PaymentsOverview>(`/buildings/${buildingId}/manage/payments/${apartmentId}/fee`, idToken, {
          method: 'PATCH',
          body: JSON.stringify({ amount, scope }),
        }),
    },
  },

  /** A resident's own monthly part, and the demo "Pay" button. */
  payments: {
    mine: (idToken: string, buildingId: string) =>
      request<MyPayments>(`/buildings/${buildingId}/payments/mine`, idToken),
    pay: (idToken: string, buildingId: string, apartmentId: number) =>
      request<MyPayments>(`/buildings/${buildingId}/payments/${apartmentId}/pay`, idToken, { method: 'POST' }),
    /** One of my apartments' log, since I was linked to it. */
    apartmentLog: (idToken: string, buildingId: string, apartmentId: number) =>
      request<PaymentLogRow[]>(`/buildings/${buildingId}/payments/${apartmentId}/log`, idToken),
    /** Owners: who pays the apartment's fee (null = back to the owner). */
    setPayer: (idToken: string, buildingId: string, apartmentId: number, userId: string | null) =>
      request<MyPayments>(`/buildings/${buildingId}/payments/${apartmentId}/payer`, idToken, {
        method: 'PUT',
        body: JSON.stringify({ userId }),
      }),
  },

  listIssues: (idToken: string, buildingId: string, status?: IssueStatus) =>
    request<Issue[]>(`/buildings/${buildingId}/issues${status ? `?status=${status}` : ''}`, idToken),

  getIssue: (idToken: string, issueId: string) => request<IssueDetail>(`/issues/${issueId}`, idToken),

  createIssue: (idToken: string, buildingId: string, dto: { title: string; description?: string }, files: File[]) => {
    const form = new FormData();
    form.append('title', dto.title);
    if (dto.description) form.append('description', dto.description);
    files.forEach((file) => form.append('files', file));
    return request<IssueDetail>(`/buildings/${buildingId}/issues`, idToken, { method: 'POST', body: form });
  },

  updateIssue: (idToken: string, issueId: string, dto: { title?: string; description?: string }) =>
    request<IssueDetail>(`/issues/${issueId}`, idToken, { method: 'PATCH', body: JSON.stringify(dto) }),

  deleteIssue: (idToken: string, issueId: string) =>
    request<{ ok: boolean }>(`/issues/${issueId}`, idToken, { method: 'DELETE' }),

  /** Building management only — the note is required. */
  changeIssueStatus: (idToken: string, issueId: string, status: IssueStatus, text: string, files: File[]) => {
    const form = new FormData();
    form.append('status', status);
    form.append('text', text);
    files.forEach((file) => form.append('files', file));
    return request<IssueDetail>(`/issues/${issueId}/status`, idToken, { method: 'POST', body: form });
  },

  /** Management or the author, while the issue is in process: text and/or files, no status change. */
  addIssueUpdate: (idToken: string, issueId: string, text: string, files: File[]) => {
    const form = new FormData();
    if (text) form.append('text', text);
    files.forEach((file) => form.append('files', file));
    return request<IssueDetail>(`/issues/${issueId}/updates`, idToken, { method: 'POST', body: form });
  },

  /** Takes back the viewer's newest update or resolve within its 5-minute window. */
  undoIssueUpdate: (idToken: string, issueId: string, updateId: string) =>
    request<IssueDetail>(`/issues/${issueId}/updates/${updateId}/undo`, idToken, { method: 'POST' }),

  pingIssue: (idToken: string, issueId: string) =>
    request<IssueDetail>(`/issues/${issueId}/ping`, idToken, { method: 'POST' }),

  /** Asks the backend for a short-lived link (after its access checks), then fetches the file as a Blob. */
  downloadIssueFile: (idToken: string, attachmentId: string) =>
    fetchPresigned(`/issue-attachments/${attachmentId}/file`, idToken),

  getMe: (idToken: string) => request<CurrentUser>('/users/me', idToken),

  /** Mirrors the browser-side onboarding profile (name, language) to the backend. */
  syncOnboarding: (idToken: string, dto: { name: string; language: string }) =>
    request<CurrentUser>('/users/me/onboarding', idToken, { method: 'PUT', body: JSON.stringify(dto) }),

  /** Private info only — apartments and roles are set by building management. */
  updateMe: (idToken: string, dto: { name?: string; phone?: string }) =>
    request<CurrentUser>('/users/me', idToken, { method: 'PATCH', body: JSON.stringify(dto) }),

  setAvatar: (idToken: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<CurrentUser>('/users/me/avatar', idToken, { method: 'PUT', body: form });
  },

  removeAvatar: (idToken: string) => request<CurrentUser>('/users/me/avatar', idToken, { method: 'DELETE' }),

  /**
   * A user's uploaded picture (needs the auth header, so fetched as a Blob). The version is in
   * the URL, so a new picture never comes back from the browser cache as the old one.
   */
  avatarBlob: (idToken: string, userId: string, version: string) =>
    fetchPresigned(`/users/${userId}/avatar?v=${encodeURIComponent(version)}`, idToken),

  deleteAccount: (idToken: string) => request<{ ok: boolean }>('/users/me', idToken, { method: 'DELETE' }),

  listMembers: (idToken: string, buildingId: string) =>
    request<Member[]>(`/buildings/${buildingId}/members`, idToken),

  listDocs: (idToken: string, buildingId: string) => request<Doc[]>(`/buildings/${buildingId}/docs`, idToken),

  uploadDoc: (idToken: string, buildingId: string, file: File, title: string) => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    return request<Doc>(`/buildings/${buildingId}/docs`, idToken, { method: 'POST', body: form });
  },

  /** Asks the backend for a short-lived link (after its access checks), then fetches the file as a Blob. */
  downloadDoc: (idToken: string, docId: string) => fetchPresigned(`/docs/${docId}/file`, idToken),

  renameDoc: (idToken: string, docId: string, title: string) =>
    request<Doc>(`/docs/${docId}`, idToken, { method: 'PATCH', body: JSON.stringify({ title }) }),

  deleteDoc: (idToken: string, docId: string) =>
    request<{ ok: boolean }>(`/docs/${docId}`, idToken, { method: 'DELETE' }),

  listCities: (idToken: string) => request<City[]>('/cities', idToken),

  admin: {
    listBuildings: (idToken: string) => request<AdminBuilding[]>('/admin/buildings', idToken),
    /** The admin joins the building with this role (it then shows on their own home screen). */
    joinBuilding: (idToken: string, buildingId: string, role: BuildingRole) =>
      request<{ ok: boolean }>(`/admin/buildings/${buildingId}/join`, idToken, {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),

    createBuilding: (idToken: string, dto: BuildingInput) =>
      request<AdminBuilding>('/admin/buildings', idToken, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),

    updateBuilding: (idToken: string, id: string, dto: Partial<BuildingInput>) =>
      request<AdminBuilding>(`/admin/buildings/${id}`, idToken, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),

    deleteBuilding: (idToken: string, id: string) =>
      request<{ ok: boolean }>(`/admin/buildings/${id}`, idToken, { method: 'DELETE' }),

    addContactLink: (idToken: string, buildingId: string, dto: ContactLinkInput) =>
      request<ContactLink>(`/admin/buildings/${buildingId}/contact-links`, idToken, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),

    removeContactLink: (idToken: string, linkId: number) =>
      request<{ ok: boolean }>(`/admin/contact-links/${linkId}`, idToken, { method: 'DELETE' }),

    setMemberRole: (idToken: string, buildingId: string, userId: string, role: BuildingRole) =>
      request<{ ok: boolean }>(`/admin/buildings/${buildingId}/members/${userId}/role`, idToken, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),

    removeMember: (idToken: string, buildingId: string, userId: string) =>
      request<{ ok: boolean }>(`/admin/buildings/${buildingId}/members/${userId}`, idToken, { method: 'DELETE' }),
  },
};
