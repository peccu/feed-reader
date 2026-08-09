<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Top bar -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-border bg-background z-20 shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <!-- Nav links -->
      <div class="flex items-center gap-3 text-muted-foreground">
        <RouterLink to="/discover" class="text-sm hover:text-foreground transition-colors">Discover</RouterLink>
        <RouterLink to="/notes" class="text-sm hover:text-foreground transition-colors">Notes</RouterLink>
      </div>

      <!-- Position indicator (tap to toggle direction) -->
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

      <!-- Settings -->
      <RouterLink to="/settings" class="text-muted-foreground hover:text-foreground transition-colors">
        <span class="text-lg">⚙</span>
      </RouterLink>
    </div>

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
      @action="handleAction"
    />

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
import { computed, onMounted, ref, watch } from "vue";
import { api } from "../api/client.ts";
import ActionBar from "../components/ActionBar.vue";
import ArticleCard from "../components/ArticleCard.vue";
import ArticleCarousel from "../components/ArticleCarousel.vue";
import { useFeedbackStore } from "../stores/feedback.ts";
import { useQueueStore } from "../stores/queue.ts";

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
  const actual = queue.direction === "forward" ? delta : -delta;
  queue.navigate(actual);
}

async function handleAction(type: "dislike" | "like" | "done" | "skip" | "note") {
  const item = queue.currentItem;
  if (!item) return;

  switch (type) {
    // Evaluation only: update the preference vector, keep the article unread.
    case "like":
    case "dislike":
      evaluations.value.set(item.articleId, type);
      await feedback.sendFeedback(item.articleId, type);
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
