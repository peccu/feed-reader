<template>
  <div class="relative h-full flex flex-col bg-background">
    <!-- Position indicator (tap to toggle reading direction) -->
    <div
      class="relative flex items-center justify-center px-4 py-2 border-b border-border bg-background z-20 shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <span
        v-if="listLabel"
        class="absolute left-4 flex items-center gap-1.5 text-xs font-semibold"
        :style="{ color: labelColor }"
      >
        <span class="inline-block w-2 h-2 rounded-full" :style="{ backgroundColor: labelColor }" />
        {{ listLabel }}
      </span>
      <button
        @click="ui.toggleDirection()"
        :title="ui.direction === 'forward' ? 'Right-hand mode (tap to switch)' : 'Left-hand mode (tap to switch)'"
        class="flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <Hand v-if="ui.direction === 'backward'" :size="15" style="transform: scaleX(-1)" />
        <span class="tabular-nums">
          {{ feed.total.value > 0 ? feed.currentIndex.value + 1 : 0 }}
          <span class="text-xs text-muted-foreground/60">/</span>
          {{ feed.total.value }}
        </span>
        <Hand v-if="ui.direction === 'forward'" :size="15" />
      </button>
    </div>

    <!-- Empty -->
    <div
      v-if="feed.total.value === 0"
      class="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-8 text-center"
    >
      <Inbox :size="48" :stroke-width="1.5" />
      <p class="text-sm">{{ emptyText }}</p>
    </div>

    <!-- Carousel -->
    <ArticleCarousel
      v-else
      class="flex-1 min-h-0"
      :current-index="feed.currentIndex.value"
      :total="feed.total.value"
      :reversed="ui.reversed"
      @navigate="onNavigate"
    >
      <ArticleCard
        v-for="(item, i) in feed.items.value"
        :key="item.id"
        :item="item"
        :article="feed.articleFor(item.articleId, i)"
      />
    </ArticleCarousel>

    <!-- Actions -->
    <ActionBar
      v-if="feed.total.value > 0"
      :disabled="!feed.currentItem.value"
      :evaluation="feed.currentEvaluation.value"
      :favorited="feed.currentItem.value?.favorited ?? false"
      :status="feed.currentItem.value?.status"
      :actions="actions"
      :reversed="ui.reversed"
      @action="onAction"
    />

    <!-- Undo banner: shown after an action removes the current item
         (dislike / read / skip). Tap Undo, or shake the phone. -->
    <transition name="undo-fade">
      <div
        v-if="pendingUndo"
        class="absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-foreground text-background shadow-xl"
        style="bottom: calc(env(safe-area-inset-bottom) + 4.75rem)"
      >
        <span class="text-sm whitespace-nowrap">{{ pendingUndo.label }}</span>
        <button
          @click="runUndo"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-background/15 active:scale-95 transition-transform"
        >
          <Undo2 :size="15" /> Undo
        </button>
      </div>
    </transition>

    <!-- Note overlay -->
    <div
      v-if="showNoteForm"
      class="absolute inset-0 bg-background/95 flex flex-col z-50"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div class="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button @click="showNoteForm = false" class="text-muted-foreground hover:text-foreground">✕</button>
        <span class="flex-1 text-center font-medium text-sm">Add note</span>
        <button
          @click="saveNote()"
          :disabled="savingNote || !noteContent.trim()"
          class="text-primary text-sm font-medium disabled:opacity-40"
        >{{ savingNote ? '…' : 'Save' }}</button>
      </div>
      <textarea
        v-model="noteContent"
        @keydown.enter.meta="saveNote"
        @keydown.enter.ctrl="saveNote"
        class="flex-1 p-4 resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Write a note about this article... (⌘/Ctrl+Enter to save)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreateNoteRequest, NoteResponse } from "@feed-reader/types";
import { Hand, Inbox, Undo2 } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { api } from "../api/client.ts";
import { type FeedItem, useArticleFeed } from "../composables/useArticleFeed.ts";
import { useUiStore } from "../stores/ui.ts";
import ActionBar from "./ActionBar.vue";
import ArticleCard from "./ArticleCard.vue";
import ArticleCarousel from "./ArticleCarousel.vue";

const props = defineProps<{
  items: FeedItem[];
  /** List identity: unread | read | skipped | favorites | training | single */
  listKey: string;
  startArticleId?: string;
  emptyText?: string;
  /** Short label shown in the header so you know which list you're viewing. */
  listLabel?: string;
}>();

const emptyText = computed(() => props.emptyText ?? "Nothing here");

// Colour-code the list label so it's obvious at a glance which list this is.
const LIST_COLORS: Record<string, string> = {
  unread: "#6366f1",
  training: "#f59e0b",
  read: "#16a34a",
  favorites: "#eab308",
  skipped: "#64748b",
  all: "#0ea5e9",
  single: "#6366f1",
};
const labelColor = computed(() => LIST_COLORS[props.listKey] ?? "#6366f1");
const ui = useUiStore();
const feed = useArticleFeed();

watch(
  () => props.items,
  (next) => {
    clearUndo();
    feed.setItems(next, props.startArticleId);
  },
  { immediate: true },
);

// Skip only makes sense while consuming the unread queue.
const actions = computed<("dislike" | "like" | "done" | "skip" | "note" | "favorite")[]>(() =>
  props.listKey === "unread" || props.listKey === "training"
    ? ["note", "dislike", "like", "done", "favorite", "skip"]
    : ["note", "dislike", "like", "done", "favorite"],
);

function onNavigate(delta: number) {
  feed.navigate(delta);
}

/** Whether an item still belongs in this feed after a status/favorite change. */
function belongs(item: FeedItem): boolean {
  switch (props.listKey) {
    case "unread":
    case "read":
    case "skipped":
      return item.status === props.listKey;
    case "training":
      return item.status === "unread";
    case "favorites":
      return item.favorited;
    default:
      return true; // single / all
  }
}

async function setStatus(status: "unread" | "read" | "skipped") {
  const item = feed.currentItem.value;
  if (!item) return;
  await api.patch(`/queue/${item.id}/status`, { status });
  item.status = status;
  if (!belongs(item)) feed.removeCurrent();
}

async function onAction(type: "dislike" | "like" | "done" | "skip" | "note" | "favorite") {
  const item = feed.currentItem.value;
  if (!item) return;
  // Snapshot before mutating so a removal can be undone (dislike/read/skip).
  const index = feed.currentIndex.value;
  const snap = snapshot(item);
  switch (type) {
    // Like/Dislike are toggles: pressing the active one clears the evaluation.
    case "like":
    case "dislike": {
      const active = feed.currentEvaluation.value === type;
      if (active) {
        feed.evaluations.value.delete(item.articleId);
        item.feedback = null;
        await api.delete(`/feedback/${item.articleId}`);
      } else {
        feed.evaluations.value.set(item.articleId, type);
        item.feedback = type;
        await api.post("/feedback", {
          articleId: item.articleId,
          feedbackType: type,
          vectorTarget: "preference",
        });
        // Dislike also marks read (won't read); like leaves status untouched.
        if (type === "dislike") {
          await setStatus("read");
          offerUndo(item, index, snap, "Marked not interested");
        }
      }
      break;
    }
    case "done": {
      const next = item.status === "read" ? "unread" : "read";
      await setStatus(next);
      offerUndo(item, index, snap, next === "read" ? "Marked read" : "Marked unread");
      break;
    }
    case "skip":
      await setStatus("skipped");
      offerUndo(item, index, snap, "Skipped");
      break;
    case "favorite": {
      const favorited = !item.favorited;
      item.favorited = favorited;
      try {
        await api.patch(`/queue/${item.id}/favorite`, { favorited });
        if (!belongs(item)) feed.removeCurrent();
      } catch {
        item.favorited = !favorited;
      }
      break;
    }
    case "note":
      noteContent.value = "";
      showNoteForm.value = true;
      break;
  }
}

// --- Note overlay ---
const showNoteForm = ref(false);
const noteContent = ref("");
const savingNote = ref(false);

async function saveNote() {
  const item = feed.currentItem.value;
  if (!item || !noteContent.value.trim() || savingNote.value) return;
  savingNote.value = true;
  try {
    const req: CreateNoteRequest = {
      articleId: item.articleId,
      content: noteContent.value.trim(),
      noteType: "manual",
    };
    await api.post<NoteResponse>("/notes", req);
    showNoteForm.value = false;
    noteContent.value = "";
  } finally {
    savingNote.value = false;
  }
}

// --- Undo (for actions that remove the current item) ---
type Snap = {
  status: FeedItem["status"];
  feedback: FeedItem["feedback"];
  favorited: boolean;
};
type PendingUndo = { label: string; index: number; item: FeedItem; snap: Snap };

const pendingUndo = ref<PendingUndo | null>(null);
let undoTimer: ReturnType<typeof setTimeout> | undefined;
const UNDO_MS = 6000;

function snapshot(item: FeedItem): Snap {
  return { status: item.status, feedback: item.feedback, favorited: item.favorited };
}

function clearUndo() {
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = undefined;
  pendingUndo.value = null;
}

/** Offer an undo only if the action actually removed the item from this list. */
function offerUndo(item: FeedItem, index: number, snap: Snap, label: string) {
  if (belongs(item)) return; // still visible → nothing was removed
  ensureMotionPermission();
  if (undoTimer) clearTimeout(undoTimer);
  pendingUndo.value = { label, index, item, snap };
  undoTimer = setTimeout(clearUndo, UNDO_MS);
}

async function runUndo() {
  const p = pendingUndo.value;
  if (!p) return;
  clearUndo();
  const { item, snap, index } = p;
  // Reverse the preference feedback, if the action set one.
  if (snap.feedback) {
    feed.evaluations.value.set(item.articleId, snap.feedback);
    item.feedback = snap.feedback;
    await api.post("/feedback", {
      articleId: item.articleId,
      feedbackType: snap.feedback,
      vectorTarget: "preference",
    });
  } else if (item.feedback) {
    feed.evaluations.value.delete(item.articleId);
    item.feedback = null;
    await api.delete(`/feedback/${item.articleId}`);
  }
  // Reverse the status change.
  if (item.status !== snap.status) {
    await api.patch(`/queue/${item.id}/status`, { status: snap.status });
    item.status = snap.status;
  }
  feed.restoreItem(item, index);
}

// --- Shake to undo (best-effort; iOS needs a permission grant) ---
let motionRequested = false;
let lastMag = 0;
let lastShakeAt = 0;

function ensureMotionPermission() {
  // Requesting must happen during a user gesture (the action tap), once.
  const DME = window.DeviceMotionEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  if (!motionRequested && DME && typeof DME.requestPermission === "function") {
    motionRequested = true;
    DME.requestPermission().catch(() => {});
  }
}

function onMotion(e: DeviceMotionEvent) {
  const a = e.accelerationIncludingGravity;
  if (!a) return;
  const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
  const delta = Math.abs(mag - lastMag);
  lastMag = mag;
  const now = Date.now();
  if (delta > 22 && now - lastShakeAt > 1200) {
    lastShakeAt = now;
    if (pendingUndo.value) runUndo();
  }
}

onMounted(() => window.addEventListener("devicemotion", onMotion));
onBeforeUnmount(() => {
  window.removeEventListener("devicemotion", onMotion);
  clearUndo();
});
</script>

<style scoped>
.undo-fade-enter-active,
.undo-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.undo-fade-enter-from,
.undo-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.5rem);
}
</style>
