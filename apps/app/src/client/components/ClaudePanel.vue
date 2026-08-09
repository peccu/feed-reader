<template>
  <div class="mt-6 pt-3 border-t border-border">
    <div class="flex items-center gap-2 mb-2">
      <Sparkles :size="14" class="text-primary" />
      <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex-1">Claude</h2>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        @click="summarize"
        :disabled="summarizing"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent disabled:opacity-50"
      >
        <Sparkles :size="14" /> {{ summarizing ? 'Summarizing…' : 'Summarize' }}
      </button>
      <button
        @click="showChat = !showChat"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
      >
        <MessageCircle :size="14" /> {{ showChat ? 'Hide chat' : 'Ask Claude' }}
      </button>
    </div>

    <!-- Summary result -->
    <div v-if="summary" class="mt-3 text-sm text-foreground bg-secondary/50 rounded-lg p-3">
      {{ summary }}
    </div>

    <!-- Chat -->
    <div v-if="showChat" class="mt-3 space-y-2">
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="[
          'text-sm rounded-lg p-2.5',
          m.role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-secondary/50 text-foreground',
        ]"
      >
        <div class="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
          <span>{{ m.role === 'user' ? 'You' : 'Claude' }}</span>
          <button
            v-if="m.role === 'assistant'"
            @click="saveNote(m.content)"
            :disabled="savingNote"
            class="ml-auto flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
          >
            <Save :size="12" /> Save as note
          </button>
        </div>
        <p class="whitespace-pre-wrap">{{ m.content }}</p>
      </div>

      <div class="flex gap-2">
        <input
          v-model="input"
          @keydown.enter="send"
          type="text"
          placeholder="Ask about this article…"
          class="flex-1 min-w-0 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          @click="send"
          :disabled="!input.trim() || sending"
          class="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          <Send :size="14" /> {{ sending ? '…' : 'Send' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-2 text-xs text-destructive">{{ error }}</p>
    <p v-if="noteSaved" class="mt-2 text-xs text-green-600 dark:text-green-400">Saved to notes.</p>
  </div>
</template>

<script setup lang="ts">
import type {
  ChatResponse,
  CreateNoteFromChatRequest,
  SummarizeResponse,
} from "@feed-reader/types";
import { MessageCircle, Save, Send, Sparkles } from "lucide-vue-next";
import { ref } from "vue";
import { api } from "../api/client.ts";

const props = defineProps<{ articleId: string }>();

const summary = ref("");
const summarizing = ref(false);
const showChat = ref(false);
const messages = ref<Array<{ role: "user" | "assistant"; content: string }>>([]);
const input = ref("");
const sending = ref(false);
const sessionId = ref<string | undefined>(undefined);
const savingNote = ref(false);
const noteSaved = ref(false);
const error = ref("");

// The Claude features proxy to the claude-worker service; surface a clear
// message rather than failing silently when it is unreachable.
const WORKER_HINT = "Claude is unavailable (is the claude-worker running?).";

async function summarize() {
  if (summarizing.value) return;
  summarizing.value = true;
  error.value = "";
  try {
    const res = await api.post<SummarizeResponse>("/claude/summarize", {
      articleId: props.articleId,
    });
    summary.value = res.summary;
  } catch {
    error.value = WORKER_HINT;
  } finally {
    summarizing.value = false;
  }
}

async function send() {
  const message = input.value.trim();
  if (!message || sending.value) return;
  sending.value = true;
  error.value = "";
  noteSaved.value = false;
  messages.value.push({ role: "user", content: message });
  input.value = "";
  try {
    const res = await api.post<ChatResponse>("/claude/chat", {
      message,
      articleId: props.articleId,
      ...(sessionId.value ? { sessionId: sessionId.value } : {}),
    });
    sessionId.value = res.sessionId;
    messages.value.push({ role: "assistant", content: res.content });
  } catch {
    error.value = WORKER_HINT;
  } finally {
    sending.value = false;
  }
}

async function saveNote(content: string) {
  if (savingNote.value) return;
  savingNote.value = true;
  noteSaved.value = false;
  error.value = "";
  try {
    const req: CreateNoteFromChatRequest = {
      articleId: props.articleId,
      content,
      sessionId: sessionId.value ?? "",
    };
    await api.post("/claude/note", req);
    noteSaved.value = true;
  } catch {
    error.value = "Could not save the note.";
  } finally {
    savingNote.value = false;
  }
}
</script>
