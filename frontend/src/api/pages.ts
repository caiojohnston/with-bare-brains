import { api } from "./client";
import type { PageCreate, PageRead, PageSummary, PageUpdate } from "../types/api";

export interface ListPagesParams {
  q?: string;
  category_id?: number;
  tag_id?: number;
  limit?: number;
  offset?: number;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const pagesApi = {
  list: (params: ListPagesParams = {}) =>
    api.get<PageSummary[]>(`/pages${buildQuery(params)}`),

  get: (id: number) => api.get<PageRead>(`/pages/${id}`),

  create: (payload: PageCreate) => api.post<PageRead>("/pages", payload),

  update: (id: number, payload: PageUpdate) =>
    api.patch<PageRead>(`/pages/${id}`, payload),

  remove: (id: number) => api.delete<void>(`/pages/${id}`),

  link: (originId: number, destinyId: number) =>
    api.post<{ origin_id: number; destiny_id: number }>(
      `/pages/${originId}/links/${destinyId}`,
    ),

  unlink: (originId: number, destinyId: number) =>
    api.delete<void>(`/pages/${originId}/links/${destinyId}`),
};
