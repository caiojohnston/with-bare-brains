import { api } from "./client";
import type { CategoryRead, CategoryTree } from "../types/api";

export interface CategoryPayload {
  category_name: string;
  parent_id?: number | null;
}

export const categoriesApi = {
  list: () => api.get<CategoryRead[]>("/categories"),
  tree: () => api.get<CategoryTree[]>("/categories/tree"),
  create: (payload: CategoryPayload) => api.post<CategoryRead>("/categories", payload),
  update: (id: number, payload: Partial<CategoryPayload>) =>
    api.patch<CategoryRead>(`/categories/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/categories/${id}`),
};
