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
    body?: string;
    imageUrl?: string;
    audience?: "all" | "direct";
    artistId?: number;
    noReply?: boolean;
  }) =>
    apiFetch<{ threadIds: number[] }>("/admin/inbox/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  const uploadImage = (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiFetch<{ url: string }>("/admin/inbox/images", {
      method: "POST",
      body: form,
    });
  };

  const reply = (id: number, payload: { body?: string; imageUrl?: string }) =>
    apiFetch<InboxThreadDetail>(`/admin/inbox/threads/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  const removeThread = (id: number) =>
    apiFetch<{ deleted: boolean }>(`/admin/inbox/threads/${id}`, {
      method: "DELETE",
    });

  return { listThreads, getThread, createThread, uploadImage, reply, removeThread };
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
