const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      credentials: "include",
      ...options,
    });
  } catch {
    throw new Error("Unable to connect to the resort server. Please make sure the backend is running with npm run server (or npm run dev:all).");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  availability: (checkIn: string, checkOut: string) => request<{ unavailable: string[] }>(`/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`),
  book: (payload: Record<string, string>) => request<{ message: string; bookingId: string }>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  subscribe: (email: string) => request<{ message: string; nextUrl: string }>("/subscribe", { method: "POST", body: JSON.stringify({ email }) }),
  contact: (payload: Record<string, string>) => request<{ message: string; messageId?: string; saved?: boolean; emailSent?: boolean }>("/contact", { method: "POST", body: JSON.stringify(payload) }),
  managerLogin: (email: string, password: string) => request<{ authenticated: boolean; email: string }>("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  managerLogout: () => request<{ authenticated: boolean }>("/admin/logout", { method: "POST" }),
  managerMe: () => request<{ authenticated: boolean; email: string }>("/admin/me"),
  managerDashboard: () => request<any>("/admin/dashboard"),
  deleteBooking: (id: string) => request<{ message: string }>(`/admin/bookings/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteMessage: (id: string) => request<{ message: string }>(`/admin/messages/${encodeURIComponent(id)}`, { method: "DELETE" }),
  deleteSubscriber: (id: string) => request<{ message: string }>(`/admin/subscribers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  forgotPassword: (email: string) => request<{ message: string }>("/admin/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<{ message: string }>("/admin/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  exportActivities: async (query: string) => {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/admin/export?${query}`, { credentials: "include" });
    } catch {
      throw new Error("Unable to connect to the resort server.");
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Export failed (${response.status}).`);
    }
    return response.blob();
  },
};
