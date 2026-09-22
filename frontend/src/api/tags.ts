import { api } from "./client";
import type { TagRead } from "../types/api";

export const tagsApi = {
  list: () => api.get<TagRead[]>("/tags"),
  create: (tag_name: string) => api.post<TagRead>("/tags", { tag_name }),
  update: (id: number, tag_name: string) =>
    api.patch<TagRead>(`/tags/${id}`, { tag_name }),
  remove: (id: number) => api.delete<void>(`/tags/${id}`),
};
