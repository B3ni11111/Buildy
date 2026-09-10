import { Building, Issue } from '../types/building';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, idToken: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listBuildings: (idToken: string) => request<Building[]>('/buildings', idToken),

  getMyBuilding: (idToken: string) => request<Building | null>('/buildings/me', idToken),

  joinBuilding: (idToken: string, buildingId: string, password: string) =>
    request<Building>('/buildings/join', idToken, {
      method: 'POST',
      body: JSON.stringify({ buildingId, password }),
    }),

  leaveBuilding: (idToken: string) =>
    request<{ ok: boolean }>('/buildings/leave', idToken, { method: 'POST' }),

  listIssues: (idToken: string, buildingId: string) =>
    request<Issue[]>(`/buildings/${buildingId}/issues`, idToken),

  createIssue: (idToken: string, buildingId: string, dto: { title: string; description: string }) =>
    request<Issue>(`/buildings/${buildingId}/issues`, idToken, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
