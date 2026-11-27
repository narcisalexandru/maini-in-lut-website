import type {
  InboxThreadDetail,
  InboxThreadList,
} from "~/types/inbox";

export function useInbox() {
  const { apiFetch } = useApi();

  const listThreads = () => apiFetch<InboxThreadList>("/admin/inbox/threads");

  const getThread = (id: number) =>
    apiFetch<InboxThreadDetail>(`/admin/inbox/threads/${id}`);

  const createThread = (payload: {
    subject: string;
    body: string;
    audience?: "all" | "direct";
    artistId?: number;
  }) =>
    apiFetch<{ threadIds: number[] }>("/admin/inbox/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  const reply = (id: number, body: string) =>
    apiFetch<InboxThreadDetail>(`/admin/inbox/threads/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });

  return { listThreads, getThread, createThread, reply };
}

export function useInboxUnread() {
  const count = useState("admin-inbox-unread", () => 0);
  const { apiFetch } = useApi();

  const refresh = async () => {
    try {
      const data = await apiFetch<{ count: number }>(
        "/admin/inbox/unread-count",
      );
      count.value = data.count;
    } catch {
      count.value = 0;
    }
  };

  return { count, refresh };
}
