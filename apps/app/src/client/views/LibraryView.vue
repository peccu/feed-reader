<template>
  <div class="h-full flex flex-col bg-background relative">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold flex-1">Library</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-3 pb-24 space-y-2">
      <RouterLink
        v-for="it in items"
        :key="it.id"
        :to="`/feed/${active}?start=${it.articleId}`"
        class="flex gap-3 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
      >
        <img
          v-if="it.leadImageUrl"
          :src="it.leadImageUrl"
          alt=""
          class="w-16 h-16 object-cover rounded-md shrink-0 bg-secondary"
          loading="lazy"
          @error="hideImg"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground line-clamp-2">{{ it.title }}</p>
          <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span class="px-1.5 py-0.5 rounded bg-secondary">{{ it.status }}</span>
            <span class="tabular-nums">{{ Math.round(it.relevanceScore * 100) }}%</span>
            <ThumbsUp v-if="it.feedback === 'like'" :size="13" class="text-yellow-500" />
            <ThumbsDown v-if="it.feedback === 'dislike'" :size="13" class="text-destructive" />
            <Bookmark v-if="it.favorited" :size="13" class="text-amber-500" />
            <span v-if="it.publishedAt" class="ml-auto">{{ formatDate(it.publishedAt) }}</span>
          </div>
        </div>
        <button
          v-if="it.status !== 'unread'"
          @click.prevent.stop="restore(it)"
          title="Move back to the unread queue"
          class="self-center shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
        >
          <Undo2 :size="14" />
          <span>Unread</span>
        </button>
      </RouterLink>

      <p v-if="!loading && items.length === 0" class="text-sm text-muted-foreground text-center py-10">
        Nothing here yet
      </p>
    </div>

    <!-- Floating back button (thumb zone) -->
    <RouterLink
      to="/"
      aria-label="Back"
      class="absolute left-3 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg text-muted-foreground hover:text-foreground"
      style="bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <ArrowLeft :size="20" />
    </RouterLink>

    <!-- Floating filter tab bar (capsule, thumb zone) -->
    <div
      class="absolute left-1/2 -translate-x-1/2 z-40 flex gap-1 p-1 rounded-full bg-card/85 backdrop-blur border border-border shadow-lg"
      style="bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="select(t.key)"
        :class="[
          'px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
          active === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        ]"
      >{{ t.label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QueueListItemResponse } from "@feed-reader/types";
import { ArrowLeft, Bookmark, ThumbsDown, ThumbsUp, Undo2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { api } from "../api/client.ts";

type TabKey = "unread" | "training" | "read" | "favorites" | "skipped" | "all";
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "unread", label: "Unread" },
  { key: "training", label: "Train" },
  { key: "read", label: "Read" },
  { key: "favorites", label: "Favorites" },
  { key: "skipped", label: "Skipped" },
  { key: "all", label: "All" },
];

const active = ref<TabKey>("unread");
const items = ref<QueueListItemResponse[]>([]);
const loading = ref(false);

function endpointFor(tab: TabKey): string {
  switch (tab) {
    case "training":
      return "/queue/training";
    case "unread":
      return "/queue/list?status=unread&sort=relevance";
    case "read":
      return "/queue/list?status=read";
    case "skipped":
      return "/queue/list?status=skipped";
    case "favorites":
      return "/queue/list?favorited=1";
    default:
      return "/queue/list";
  }
}

async function load() {
  loading.value = true;
  try {
    const res = await api.get<{ items: QueueListItemResponse[] }>(endpointFor(active.value));
    items.value = res.items;
  } finally {
    loading.value = false;
  }
}

function select(tab: TabKey) {
  if (active.value === tab) return;
  active.value = tab;
  load();
}

async function restore(it: QueueListItemResponse) {
  await api.patch(`/queue/${it.id}/status`, { status: "unread" });
  await load();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function hideImg(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}

onMounted(load);
</script>
