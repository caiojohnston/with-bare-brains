import { api } from "./client";

export const authApi = {
  login: (password: string) => api.post<{ message: string }>("/auth/login", { password }),
  logout: () => api.post<{ message: string }>("/auth/logout"),
  check: () => api.get<{ authenticated: boolean }>("/auth/check"),
};
