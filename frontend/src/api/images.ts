import { api } from "./client";
import type { ImageRead } from "../types/api";

export const imagesApi = {
  upload: (pageId: number, file: File, altText: string) => {
    const form = new FormData();
    form.set("file", file);
    form.set("alt_text", altText);
    return api.post<ImageRead>(`/images/upload/${pageId}`, form);
  },

  listForPage: (pageId: number) => api.get<ImageRead[]>(`/images/page/${pageId}`),

  remove: (imageId: number) => api.delete<{ message: string }>(`/images/${imageId}`),
};
