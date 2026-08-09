<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Position indicator (tap to toggle reading direction) -->
    <div
      class="flex items-center justify-center px-4 py-2 border-b border-border bg-background z-20 shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <button
        @click="ui.toggleDirection()"
        :title="ui.direction === 'forward' ? 'Right-hand mode (tap to switch)' : 'Left-hand mode (tap to switch)'"
        class="flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <Hand v-if="ui.direction === 'backward'" :size="15" style="transform: scaleX(-1)" />
        <span class="text-xs">{{ ui.direction === 'forward' ? '→' : '←' }}</span>
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
        class="flex-1 p-4 resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Write a note about this article..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreateNoteRequest, NoteResponse } from "@feed-reader/types";
import { Hand, Inbox } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
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
}>();

const emptyText = computed(() => props.emptyText ?? "Nothing here");
const ui = useUiStore();
const feed = useArticleFeed();

watch(
  () => props.items,
  (next) => feed.setItems(next, props.startArticleId),
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
  switch (type) {
    case "like":
      feed.evaluations.value.set(item.articleId, "like");
      await api.post("/feedback", {
        articleId: item.articleId,
        feedbackType: "like",
        vectorTarget: "preference",
      });
      break;
    case "dislike":
      await api.post("/feedback", {
        articleId: item.articleId,
        feedbackType: "dislike",
        vectorTarget: "preference",
      });
      await setStatus("read");
      break;
    case "done":
      await setStatus(item.status === "read" ? "unread" : "read");
      break;
    case "skip":
      await setStatus("skipped");
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
</script>
