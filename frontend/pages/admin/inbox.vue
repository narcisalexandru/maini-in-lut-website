<template>
  <div class="flex h-full min-h-[32rem] flex-col">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold h-color-lunar-green">{{ t("title") }}</h1>
        <p class="mt-1 h-color-lunar-green">{{ t("subtitle") }}</p>
      </div>
      <Button :label="t('newMessage')" icon="ph ph-plus" @click="openCompose" />
    </div>

    <p v-if="listError" class="mb-3 text-sm text-red-700">{{ listError }}</p>

    <div class="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white">
      <aside
        class="w-full flex-col border-[#e8e8e8] md:flex md:w-80 md:border-r"
        :class="activeId !== null ? 'hidden' : 'flex'"
      >
        <p v-if="loadingList && threads.length === 0" class="p-4 h-color-lunar-green">
          {{ t("loading") }}
        </p>
        <p v-else-if="threads.length === 0" class="p-4 h-color-lunar-green">
          {{ t("empty") }}
        </p>
        <ul v-else class="min-h-0 flex-1 overflow-y-auto">
          <li v-for="thread in threads" :key="thread.id" class="relative">
            <button
              type="button"
              class="w-full border-b border-[#f0f0f0] px-4 py-3 pr-10 text-left hover:bg-[#f7f8f4]"
              :class="{ 'bg-[#eef2e6]': thread.id === activeId }"
              @click="openThread(thread.id)"
            >
              <span class="flex items-start justify-between gap-2">
                <span class="font-semibold h-color-lunar-green">
                  {{ threadTitle(thread) }}
                </span>
                <span
                  v-if="thread.unread"
                  class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#144111]"
                  :aria-label="t('unread')"
                />
              </span>
              <span class="mt-1 block truncate text-sm h-color-lunar-green">
                {{ thread.subject }}
              </span>
              <span class="mt-1 block truncate text-xs text-[#6b7280]">
                {{ thread.preview || (thread.hasImage ? t("photo") : "") }}
              </span>
              <time class="mt-1 block text-xs text-[#6b7280]" :datetime="thread.lastMessageAt">
                {{ formatWhen(thread.lastMessageAt) }}
              </time>
            </button>
            <button
              type="button"
              class="absolute right-2 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#144111]"
              :aria-label="t('delete')"
              @click="openDeleteDialog(thread)"
            >
              <i class="ph ph-x text-base" />
            </button>
          </li>
        </ul>
      </aside>

      <section
        class="min-w-0 flex-1 flex-col md:flex"
        :class="activeId === null ? 'hidden' : 'flex'"
      >
        <template v-if="active">
          <header class="flex items-center gap-3 border-b border-[#e8e8e8] px-4 py-3">
            <button
              type="button"
              class="md:hidden h-color-lunar-green"
              :aria-label="t('back')"
              @click="activeId = null"
            >
              <i class="ph ph-arrow-left text-lg" />
            </button>
            <div class="min-w-0">
              <h2 class="truncate font-semibold h-color-lunar-green">
                {{ active.subject }}
              </h2>
              <p class="truncate text-sm text-[#6b7280]">
                {{ isSuperAdmin ? active.artistName || (active.broadcast ? t("allArtists") : "") : t("administrator") }}
              </p>
            </div>
          </header>
          <div ref="messagePane" class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <article
              v-for="message in active.messages"
              :key="message.id"
              class="flex"
              :class="message.mine ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl px-4 py-2"
                :class="
                  message.mine
                    ? 'bg-[#144111] text-white'
                    : 'bg-[#f3f4f6] h-color-lunar-green'
                "
              >
                <p class="mb-1 text-xs opacity-80">
                  {{ senderLabel(message.senderRole, message.mine) }}
                </p>
                <img
                  v-if="message.imageUrl"
                  :src="resolveProductImageUrl(message.imageUrl)"
                  :alt="t('photo')"
                  class="mt-1 max-h-64 w-full rounded-xl object-cover"
                />
                <p v-if="message.body" class="whitespace-pre-wrap">{{ message.body }}</p>
                <time class="mt-1 block text-xs opacity-70" :datetime="message.createdAt">
                  {{ formatWhen(message.createdAt) }}
                </time>
              </div>
            </article>
          </div>
          <div
            v-if="!active.repliesDisabled && replyPreview"
            class="flex items-center gap-2 border-t border-[#e8e8e8] px-3 pt-3"
          >
            <img :src="replyPreview" :alt="t('photo')" class="h-14 w-14 rounded-lg object-cover" />
            <button
              type="button"
              class="text-sm h-color-lunar-green"
              @click="clearReplyImage"
            >
              {{ t("removeImage") }}
            </button>
          </div>
          <form
            v-if="!active.repliesDisabled"
            class="flex items-center gap-2 border-t border-[#e8e8e8] p-3"
            @submit.prevent="sendReply"
          >
            <input
              ref="replyFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onReplyFile"
            />
            <Button
              type="button"
              icon="ph ph-image"
              severity="secondary"
              :aria-label="t('attachImage')"
              @click="replyFileInput?.click()"
            />
            <Textarea
              v-model="replyBody"
              class="flex-1"
              rows="2"
              auto-resize
              :placeholder="t('replyPlaceholder')"
              :maxlength="4000"
              @keydown.enter.exact.prevent="sendReply"
            />
            <Button
              type="submit"
              icon="ph ph-paper-plane-tilt"
              :label="t('send')"
              :disabled="replying || (!replyBody.trim() && !replyFile)"
              :loading="replying"
            />
          </form>
          <p v-else class="border-t border-[#e8e8e8] px-4 py-3 text-sm text-[#6b7280]">
            {{ t("notificationOnly") }}
          </p>
          <p v-if="replyError" class="px-4 pb-3 text-sm text-red-700">{{ replyError }}</p>
        </template>
        <p v-else class="m-auto h-color-lunar-green">{{ t("pick") }}</p>
      </section>
    </div>

    <Dialog
      v-model:visible="composeOpen"
      modal
      :header="t('newMessage')"
      :style="{ width: '32rem' }"
    >
      <form class="flex flex-col gap-4" @submit.prevent="sendNew">
        <div v-if="isSuperAdmin" class="flex flex-col gap-2">
          <label class="text-sm font-medium h-color-lunar-green" for="inbox-recipient">
            {{ t("recipient") }}
          </label>
          <Select
            v-model="recipient"
            input-id="inbox-recipient"
            :options="recipientOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>
        <p v-else class="text-sm h-color-lunar-green">{{ t("toAdmin") }}</p>
        <div v-if="isSuperAdmin" class="flex items-center gap-2">
          <Checkbox v-model="noReply" binary input-id="inbox-no-reply" />
          <label class="text-sm h-color-lunar-green" for="inbox-no-reply">
            {{ t("noReply") }}
          </label>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium h-color-lunar-green" for="inbox-subject">
            {{ t("subject") }}
          </label>
          <InputText
            id="inbox-subject"
            v-model="subject"
            class="w-full"
            :maxlength="160"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium h-color-lunar-green" for="inbox-body">
            {{ t("message") }}
          </label>
          <Textarea
            id="inbox-body"
            v-model="composeBody"
            class="w-full"
            rows="5"
            auto-resize
            :maxlength="4000"
          />
          <input
            ref="composeFileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onComposeFile"
          />
          <div class="flex items-center gap-3">
            <Button
              type="button"
              icon="ph ph-image"
              severity="secondary"
              :label="t('attachImage')"
              @click="composeFileInput?.click()"
            />
            <img
              v-if="composePreview"
              :src="composePreview"
              :alt="t('photo')"
              class="h-14 w-14 rounded-lg object-cover"
            />
            <button
              v-if="composePreview"
              type="button"
              class="text-sm h-color-lunar-green"
              @click="clearComposeImage"
            >
              {{ t("removeImage") }}
            </button>
          </div>
        </div>
        <p v-if="composeError" class="text-sm text-red-700">{{ composeError }}</p>
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            severity="secondary"
            :label="t('cancel')"
            @click="composeOpen = false"
          />
          <Button
            type="submit"
            :label="t('send')"
            :loading="sending"
            :disabled="sending || (subject.trim().length < 3 || (!composeBody.trim() && !composeFile))"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      :header="t('deleteTitle')"
      :style="{ width: '480px' }"
    >
      <p class="text-sm h-color-lunar-green m-0">
        {{ t("deleteConfirm", { subject: threadToDelete?.subject ?? "" }) }}
      </p>
      <template #footer>
        <Button
          severity="secondary"
          :label="t('cancel')"
          :disabled="deleting"
          @click="deleteDialogVisible = false"
        />
        <Button
          severity="danger"
          :label="t('deleteConfirmAction')"
          :loading="deleting"
          @click="confirmDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import type { InboxSenderRole, InboxThreadDetail, InboxThreadSummary } from "~/types/inbox";
import { resolveProductImageUrl } from "~/utils/product-image";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t, locale } = useI18n({ useScope: "local" });
const { isSuperAdmin } = useAuth();
const { listThreads, getThread, createThread, uploadImage, reply, removeThread } = useInbox();
const { refresh: refreshUnread } = useInboxUnread();

const threads = ref<InboxThreadSummary[]>([]);
const artists = ref<{ id: number; displayName: string }[]>([]);
const activeId = ref<number | null>(null);
const active = ref<InboxThreadDetail | null>(null);
const loadingList = ref(true);
const listError = ref("");
const replyBody = ref("");
const replyFile = ref<File | null>(null);
const replyPreview = ref("");
const replyFileInput = ref<HTMLInputElement | null>(null);
const replyError = ref("");
const replying = ref(false);
const composeOpen = ref(false);
const subject = ref("");
const composeBody = ref("");
const composeFile = ref<File | null>(null);
const composePreview = ref("");
const composeFileInput = ref<HTMLInputElement | null>(null);
const recipient = ref("all");
const noReply = ref(false);
const composeError = ref("");
const sending = ref(false);
const deleteDialogVisible = ref(false);
const threadToDelete = ref<InboxThreadSummary | null>(null);
const deleting = ref(false);
const messagePane = ref<HTMLElement | null>(null);

const recipientOptions = computed(() => [
  { label: t("allArtists"), value: "all" },
  ...artists.value.map((artist) => ({
    label: artist.displayName,
    value: String(artist.id),
  })),
]);

const threadTitle = (thread: InboxThreadSummary) => {
  if (!isSuperAdmin.value) {
    return t("administrator");
  }
  return thread.broadcast ? t("allArtists") : thread.artistName;
};

const senderLabel = (role: InboxSenderRole, mine: boolean) => {
  if (mine) {
    return t("you");
  }
  return role === "SUPER_ADMIN" ? t("administrator") : t("artist");
};

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const scrollMessages = async () => {
  await nextTick();
  const pane = messagePane.value;
  if (pane) {
    pane.scrollTop = pane.scrollHeight;
  }
};

const loadList = async () => {
  listError.value = "";
  try {
    const data = await listThreads();
    threads.value = data.threads;
    artists.value = data.artists;
  } catch (error) {
    listError.value = error instanceof Error ? error.message : t("loadError");
  } finally {
    loadingList.value = false;
  }
};

const openThread = async (id: number) => {
  activeId.value = id;
  replyError.value = "";
  try {
    active.value = await getThread(id);
    const current = threads.value.find((thread) => thread.id === id);
    if (current) {
      current.unread = false;
    }
    await refreshUnread();
    await scrollMessages();
  } catch (error) {
    replyError.value = error instanceof Error ? error.message : t("loadError");
  }
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const rememberImage = (
  file: File | undefined,
  currentPreview: { value: string },
  currentFile: { value: File | null },
  errorTarget: { value: string },
) => {
  if (!file) {
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    errorTarget.value = t("imageInvalid");
    return;
  }
  errorTarget.value = "";
  if (currentPreview.value) {
    URL.revokeObjectURL(currentPreview.value);
  }
  currentFile.value = file;
  currentPreview.value = URL.createObjectURL(file);
};

const onReplyFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  rememberImage(input.files?.[0], replyPreview, replyFile, replyError);
  input.value = "";
};

const onComposeFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  rememberImage(input.files?.[0], composePreview, composeFile, composeError);
  input.value = "";
};

const clearReplyImage = () => {
  if (replyPreview.value) {
    URL.revokeObjectURL(replyPreview.value);
  }
  replyPreview.value = "";
  replyFile.value = null;
};

const clearComposeImage = () => {
  if (composePreview.value) {
    URL.revokeObjectURL(composePreview.value);
  }
  composePreview.value = "";
  composeFile.value = null;
};

const uploadErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  if (message === "File could not be read as an image") {
    return t("imageUnreadable");
  }
  if (message === "Each image must be under 10MB") {
    return t("imageInvalid");
  }
  return message || t("sendError");
};

const uploadedImageUrl = async (file: File | null) => {
  if (!file) {
    return undefined;
  }
  const uploaded = await uploadImage(file);
  return uploaded.url;
};

const openCompose = () => {
  subject.value = "";
  composeBody.value = "";
  clearComposeImage();
  recipient.value = "all";
  noReply.value = false;
  composeError.value = "";
  composeOpen.value = true;
};

const sendNew = async () => {
  const trimmedSubject = subject.value.trim();
  const trimmedBody = composeBody.value.trim();
  if (trimmedSubject.length < 3 || (!trimmedBody && !composeFile.value)) {
    composeError.value = t("invalid");
    return;
  }
  sending.value = true;
  composeError.value = "";
  try {
    const payload: {
      subject: string;
      body: string;
      audience?: "all" | "direct";
      artistId?: number;
      noReply?: boolean;
      imageUrl?: string;
    } = {
      subject: trimmedSubject,
      body: trimmedBody,
      noReply: noReply.value,
      imageUrl: await uploadedImageUrl(composeFile.value),
    };
    if (isSuperAdmin.value) {
      if (recipient.value === "all") {
        payload.audience = "all";
      } else {
        payload.audience = "direct";
        payload.artistId = Number(recipient.value);
      }
    }
    const result = await createThread(payload);
    clearComposeImage();
    composeOpen.value = false;
    await loadList();
    await refreshUnread();
    if (result.threadIds.length === 1) {
      await openThread(result.threadIds[0]);
    }
  } catch (error) {
    composeError.value = uploadErrorMessage(error);
  } finally {
    sending.value = false;
  }
};

const openDeleteDialog = (thread: InboxThreadSummary) => {
  threadToDelete.value = thread;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  const thread = threadToDelete.value;
  if (!thread || deleting.value) {
    return;
  }
  deleting.value = true;
  try {
    await removeThread(thread.id);
    if (activeId.value === thread.id) {
      activeId.value = null;
      active.value = null;
    }
    deleteDialogVisible.value = false;
    threadToDelete.value = null;
    await loadList();
    await refreshUnread();
  } catch (error) {
    listError.value = error instanceof Error ? error.message : t("deleteError");
  } finally {
    deleting.value = false;
  }
};

const sendReply = async () => {
  if (!activeId.value || replying.value || (!replyBody.value.trim() && !replyFile.value)) {
    return;
  }
  replying.value = true;
  replyError.value = "";
  try {
    active.value = await reply(activeId.value, {
      body: replyBody.value.trim(),
      imageUrl: await uploadedImageUrl(replyFile.value),
    });
    replyBody.value = "";
    clearReplyImage();
    await loadList();
    await refreshUnread();
    await scrollMessages();
  } catch (error) {
    replyError.value = uploadErrorMessage(error);
  } finally {
    replying.value = false;
  }
};

let timer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  await loadList();
  await refreshUnread();
  timer = setInterval(async () => {
    await loadList();
    if (activeId.value) {
      try {
        const fresh = await getThread(activeId.value);
        const grew =
          (active.value?.messages.length ?? 0) !== fresh.messages.length;
        active.value = fresh;
        if (grew) {
          await scrollMessages();
        }
        await refreshUnread();
      } catch {
        replyError.value = t("loadError");
      }
    }
  }, 20000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
  clearReplyImage();
  clearComposeImage();
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Inbox",
    "subtitle": "Mesaje între artiști și administrator.",
    "newMessage": "Mesaj nou",
    "loading": "Se încarcă...",
    "empty": "Nu ai conversații încă.",
    "unread": "Necitit",
    "back": "Înapoi",
    "administrator": "Administrator",
    "artist": "Artist",
    "you": "Tu",
    "replyPlaceholder": "Scrie un răspuns",
    "send": "Trimite",
    "attachImage": "Adaugă o poză",
    "removeImage": "Elimină poza",
    "photo": "Fotografie",
    "imageInvalid": "Poza trebuie să aibă cel mult 10 MB.",
    "imageUnreadable": "Fișierul nu a putut fi citit ca imagine.",
    "pick": "Alege o conversație.",
    "recipient": "Destinatar",
    "allArtists": "Toți artiștii",
    "toAdmin": "Mesajul ajunge la administrator.",
    "noReply": "Doar notificare, fără răspuns",
    "notificationOnly": "Acest mesaj este o notificare. Nu se poate răspunde.",
    "delete": "Șterge conversația",
    "deleteTitle": "Șterge conversația",
    "deleteConfirm": "Ștergi conversația „{subject}”?",
    "deleteConfirmAction": "Da, șterge",
    "deleteError": "Conversația nu a putut fi ștearsă.",
    "subject": "Subiect",
    "message": "Mesaj",
    "cancel": "Renunță",
    "invalid": "Subiectul are nevoie de cel puțin 3 caractere și mesajul sau poza nu poate lipsi.",
    "loadError": "Conversația nu a putut fi încărcată.",
    "sendError": "Mesajul nu a putut fi trimis."
  },
  "en": {
    "title": "Inbox",
    "subtitle": "Messages between artists and the administrator.",
    "newMessage": "New message",
    "loading": "Loading...",
    "empty": "No conversations yet.",
    "unread": "Unread",
    "back": "Back",
    "administrator": "Administrator",
    "artist": "Artist",
    "you": "You",
    "replyPlaceholder": "Write a reply",
    "send": "Send",
    "attachImage": "Add a photo",
    "removeImage": "Remove photo",
    "photo": "Photo",
    "imageInvalid": "The photo must be at most 10 MB.",
    "imageUnreadable": "The file could not be read as an image.",
    "pick": "Choose a conversation.",
    "recipient": "Recipient",
    "allArtists": "All artists",
    "toAdmin": "The message goes to the administrator.",
    "noReply": "Notification only, no reply",
    "notificationOnly": "This message is a notification. Replies are closed.",
    "delete": "Delete conversation",
    "deleteTitle": "Delete conversation",
    "deleteConfirm": "Delete the conversation “{subject}”?",
    "deleteConfirmAction": "Yes, delete",
    "deleteError": "The conversation could not be deleted.",
    "subject": "Subject",
    "message": "Message",
    "cancel": "Cancel",
    "invalid": "The subject needs at least 3 characters, and the message or a photo is required.",
    "loadError": "The conversation could not be loaded.",
    "sendError": "The message could not be sent."
  }
}
</i18n>
