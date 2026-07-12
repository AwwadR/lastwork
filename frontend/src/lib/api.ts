// lib/api.ts — typed API client with conversation_id support
const BASE = "/api";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = err.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg?: string }) => item.msg || "Invalid input").join("; ")
        : detail?.message || res.statusText || "Request failed";
    throw new Error(message);
  }
  return res.json();
}

export interface HistoryMessage { role: "user" | "assistant"; content: string; }

export interface ActionCard {
  action: string;
  request_id?: string | null;
  ticket_id?:  string | null;
  order_id?:   string | null;
  amount?:     number | null;
  status?:     string | null;
  next_step?:  string | null;
  reason?:     string | null;
  success?:    boolean;
}

export interface ChatApiResponse {
  request_id:          string;
  conversation_id:     string;
  answer:              string;
  intent:              string;
  citations:           Array<{ source?: string; title?: string; chunk_id?: string }>;
  action_taken:        string | null;
  action_card:         ActionCard | null;
  confirmation_prompt: string | null;
  tools_used:          string[];
  iterations:          number;
  history:             HistoryMessage[];
}

export const api = {
  login: (email: string, password: string) =>
    req<{ access_token: string }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),

  loginByCustomerId: (customer_id: string, password: string) =>
    req<{ access_token: string }>("/auth/login/customer", {
      method: "POST", body: JSON.stringify({ customer_id, password }),
    }),

  register: (email: string, password: string, customer_id: string) =>
    req<{ customer_id: string; email: string; role: string }>("/auth/register", {
      method: "POST", body: JSON.stringify({ email, password, customer_id }),
    }),

  me: () => req<{ customer_id: string; email: string; role: string }>("/auth/me"),

  // conversation_id sent on every turn so backend can resume pending confirmation
  chat: (
    message: string,
    history: HistoryMessage[] = [],
    conversation_id: string | null = null,
  ) => req<ChatApiResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, history, conversation_id }),
  }),

  // trailing slash prevents 307 redirect stripping Authorization header
  orders:     () => req<any[]>("/orders/"),
  tickets:    () => req<any[]>("/orders/tickets"),
  requests:   () => req<any[]>("/orders/requests"),
  allTickets: () => req<any[]>("/orders/admin/tickets"),
};
