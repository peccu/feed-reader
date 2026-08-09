<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Top bar: position indicator only (nav lives in the bottom menu) -->
    <div
      class="flex items-center justify-center px-4 py-2 border-b border-border bg-background z-20 shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <button
        @click="queue.toggleDirection()"
        class="flex items-center gap-1 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        :title="queue.direction === 'forward' ? '→ Forward (tap to reverse)' : '← Reverse (tap for forward)'"
      >
        <span class="text-xs">{{ queue.direction === 'forward' ? '→' : '←' }}</span>
        <span class="tabular-nums">
          {{ queue.total > 0 ? queue.currentIndex + 1 : 0 }}
          <span class="text-xs text-muted-foreground/60">/</span>
          {{ queue.total }}
        </span>
      </button>
    </div>

    <!-- Floating menu button (bottom, thumb zone; mirrors with direction) -->
    <button
      @click="showMenu = true"
      aria-label="Menu"
      class="absolute z-40 flex items-center justify-center w-11 h-11 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg text-muted-foreground hover:text-foreground"
      :class="queue.direction === 'forward' ? 'right-3' : 'left-3'"
      style="bottom: calc(env(safe-area-inset-bottom) + 4.75rem)"
    >
      <Menu :size="20" />
    </button>

    <!-- Empty state -->
    <div
      v-if="!queue.loading && queue.total === 0"
      class="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground px-8 text-center"
    >
      <span class="text-5xl">🎉</span>
      <p class="text-base font-medium text-foreground">Queue is empty</p>
      <p class="text-sm">Add a feed or submit a URL</p>
      <RouterLink
        to="/settings"
        class="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
      >
        Manage feeds →
      </RouterLink>
    </div>

    <!-- Carousel -->
    <ArticleCarousel
      v-else
      class="flex-1 min-h-0"
      :current-index="queue.currentIndex"
      :total="queue.total"
      :reversed="queue.direction === 'backward'"
      @navigate="handleNavigate"
    >
      <ArticleCard
        v-for="(item, i) in visibleItems"
        :key="item.queueItem.id"
        :item="item.queueItem"
        :article="item.article"
      />
    </ArticleCarousel>

    <!-- Action bar -->
    <ActionBar
      v-if="queue.total > 0"
      :disabled="queue.loading || !queue.currentItem"
      :evaluation="currentEvaluation"
      :favorited="queue.currentItem?.favorited ?? false"
      @action="handleAction"
    />

    <!-- Navigation menu (bottom sheet) -->
    <div v-if="showMenu" class="absolute inset-0 z-50" @click.self="showMenu = false">
      <div class="absolute inset-0 bg-black/40" @click="showMenu = false" />
      <nav
        class="absolute left-0 right-0 bottom-0 bg-background border-t border-border rounded-t-2xl p-2"
        style="padding-bottom: max(1rem, env(safe-area-inset-bottom))"
      >
        <RouterLink
          v-for="link in menuLinks"
          :key="link.to"
          :to="link.to"
          @click="showMenu = false"
          class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent text-foreground"
        >
          <component :is="link.icon" :size="20" class="text-muted-foreground" />
          <span class="text-sm font-medium">{{ link.label }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- Note overlay (card stays the reader; no navigation) -->
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
        class="flex-1 p-4 resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Write a note about this article..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  ArticleDetailResponse,
  CreateNoteRequest,
  NoteResponse,
  QueueItemResponse,
} from "@feed-reader/types";
import {
  Compass,
  Gauge,
  Library,
  Menu,
  NotebookText,
  Settings,
  Tags,
  Target,
} from "lucide-vue-next";
import { type Component, computed, onMounted, ref, watch } from "vue";
import { api } from "../api/client.ts";
import ActionBar from "../components/ActionBar.vue";
import ArticleCard from "../components/ArticleCard.vue";
import ArticleCarousel from "../components/ArticleCarousel.vue";
import { useFeedbackStore } from "../stores/feedback.ts";
import { useQueueStore } from "../stores/queue.ts";

const showMenu = ref(false);
const menuLinks: Array<{ to: string; label: string; icon: Component }> = [
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/train", label: "Train", icon: Target },
  { to: "/library", label: "Library", icon: Library },
  { to: "/notes", label: "Notes", icon: NotebookText },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/settings", label: "Settings / Feeds", icon: Settings },
  { to: "/admin", label: "Admin / Status", icon: Gauge },
];

const queue = useQueueStore();
const feedback = useFeedbackStore();

const showNoteForm = ref(false);
const noteContent = ref("");
const savingNote = ref(false);

// Local record of like/dislike per article so the buttons reflect that an
// evaluation was sent — evaluation does NOT change queue status or remove the
// article (that's what "Read"/"Skip" do).
const evaluations = ref<Map<string, "like" | "dislike">>(new Map());
const currentEvaluation = computed(
  () => queue.currentItem && (evaluations.value.get(queue.currentItem.articleId) ?? null),
);

// Prefetch current + adjacent articles
const prefetchRange = 1;
interface VisibleItem {
  queueItem: QueueItemResponse;
  article: ArticleDetailResponse | null;
}

const visibleItems = computed((): VisibleItem[] => {
  return queue.items.map((item, i) => {
    const inRange = Math.abs(i - queue.currentIndex) <= prefetchRange;
    return {
      queueItem: item,
      article: inRange ? (queue.articleCache.get(item.articleId) ?? null) : null,
    };
  });
});

// Prefetch articles near current index. Watches both the index and the loaded
// item count so prefetching also kicks in once fetchQueue() populates the list
// (currentIndex stays 0 on first load, so watching it alone never fires).
function prefetchAround(idx: number) {
  for (
    let i = Math.max(0, idx - prefetchRange);
    i <= Math.min(queue.total - 1, idx + prefetchRange);
    i++
  ) {
    const item = queue.items[i];
    if (item) queue.fetchArticle(item.articleId);
  }
}

watch(
  () => [queue.currentIndex, queue.items.length] as const,
  () => prefetchAround(queue.currentIndex),
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([queue.fetchQueue(), queue.fetchStats()]);
});

function handleNavigate(delta: number) {
  // The carousel already mirrors its emitted delta when reversed.
  queue.navigate(delta);
}

async function handleAction(type: "dislike" | "like" | "done" | "skip" | "note" | "favorite") {
  const item = queue.currentItem;
  if (!item) return;

  switch (type) {
    // Evaluation only: update the preference vector, keep the article unread.
    case "like":
    case "dislike":
      evaluations.value.set(item.articleId, type);
      await feedback.sendFeedback(item.articleId, type);
      break;

    case "favorite":
      await queue.toggleFavorite(item.id);
      break;

    // Finished reading → mark read (leaves the unread queue).
    case "done":
      await queue.updateStatus(item.id, "read");
      break;

    // Not now → skip (leaves the unread queue).
    case "skip":
      await queue.updateStatus(item.id, "skipped");
      break;

    case "note":
      noteContent.value = "";
      showNoteForm.value = true;
      break;
  }
}

async function saveNote() {
  const item = queue.currentItem;
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
</script>
