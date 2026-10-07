import {
  AdminBuilding,
  Building,
  BuildingInput,
  BuildingSummary,
  City,
  ContactLink,
  ContactLinkInput,
  CurrentUser,
  Doc,
  ApartmentInput,
  BlockedUser,
  BuildingRole,
  Member,
  Message,
  MessageType,
  RelationType,
} from '../types/building';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// While an admin previews the app as a resident, every request says so and the backend
// treats them as the lowest level (it can only remove powers, never add them).
let viewAsResident = false;
export function setViewAsResident(on: boolean) {
  viewAsResident = on;
}

async function send(path: string, idToken: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // FormData sets its own multipart Content-Type (with boundary).
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${idToken}`,
      ...(viewAsResident ? { 'X-View-As': 'resident' } : {}),
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

export const api = {
  listBuildings: (idToken: string) => request<BuildingSummary[]>('/buildings', idToken),

  /** Every building the user belongs to, each from their point of view. */
  getMyBuildings: (idToken: string) => request<Building[]>('/buildings/mine', idToken),

  /** apartment / relationType are only a suggestion — building management confirms them. */
  joinBuilding: (
    idToken: string,
    buildingId: string,
    password: string,
    suggestion: { apartment?: number; relationType?: RelationType } = {},
  ) =>
    request<Building>('/buildings/join', idToken, {
      method: 'POST',
      body: JSON.stringify({ buildingId, password, ...suggestion }),
    }),

  /** The user's own apartment + owner/renter suggestion (building management confirms it). */
  setMyRequest: (idToken: string, buildingId: string, dto: { apartment: number; relationType: RelationType }) =>
    request<Building>(`/buildings/${buildingId}/my-request`, idToken, { method: 'PUT', body: JSON.stringify(dto) }),

  leaveBuilding: (idToken: string, buildingId: string) =>
    request<{ ok: boolean }>(`/buildings/${buildingId}/leave`, idToken, { method: 'POST' }),

  /** Building management (committee head / management company of the building, or admin). */
  manage: {
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
      dto: { description?: string | null; entryCode?: string | null; password?: string },
    ) =>
      request<Building>(`/buildings/${buildingId}/manage/details`, idToken, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
  },

  listMessages: (idToken: string, buildingId: string) =>
    request<Message[]>(`/buildings/${buildingId}/messages`, idToken),

  createMessage: (
    idToken: string,
    buildingId: string,
    dto: { title: string; description?: string; type?: MessageType },
  ) =>
    request<Message>(`/buildings/${buildingId}/messages`, idToken, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateMessage: (idToken: string, messageId: string, dto: { title?: string; description?: string; type?: MessageType }) =>
    request<Message>(`/messages/${messageId}`, idToken, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteMessage: (idToken: string, messageId: string) =>
    request<{ ok: boolean }>(`/messages/${messageId}`, idToken, { method: 'DELETE' }),

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
  avatarBlob: async (idToken: string, userId: string, version: string) =>
    (await send(`/users/${userId}/avatar?v=${encodeURIComponent(version)}`, idToken)).blob(),

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

  /** Downloads with the auth header (a plain link can't send it) and returns the file as a Blob. */
  downloadDoc: async (idToken: string, docId: string) => (await send(`/docs/${docId}/file`, idToken)).blob(),

  renameDoc: (idToken: string, docId: string, title: string) =>
    request<Doc>(`/docs/${docId}`, idToken, { method: 'PATCH', body: JSON.stringify({ title }) }),

  deleteDoc: (idToken: string, docId: string) =>
    request<{ ok: boolean }>(`/docs/${docId}`, idToken, { method: 'DELETE' }),

  listCities: (idToken: string) => request<City[]>('/cities', idToken),

  admin: {
    listBuildings: (idToken: string) => request<AdminBuilding[]>('/admin/buildings', idToken),

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
