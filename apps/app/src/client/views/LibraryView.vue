<template>
  <div class="h-full flex flex-col bg-background relative">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">Library</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-3 pb-24 space-y-2">
      <RouterLink
        v-for="it in items"
        :key="it.id"
        :to="`/reader/${it.articleId}`"
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
            <span v-if="it.favorited" class="text-amber-500">★</span>
            <span v-if="it.publishedAt">{{ formatDate(it.publishedAt) }}</span>
          </div>
        </div>
        <button
          v-if="it.status !== 'unread'"
          @click.prevent.stop="restore(it)"
          title="Move back to the unread queue"
          class="self-center shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
        >↩ Unread</button>
      </RouterLink>

      <p v-if="!loading && items.length === 0" class="text-sm text-muted-foreground text-center py-10">
        Nothing here yet
      </p>
    </div>

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
import { onMounted, ref } from "vue";
import { api } from "../api/client.ts";

type TabKey = "read" | "favorites" | "skipped" | "all";
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "read", label: "Read" },
  { key: "favorites", label: "Favorites" },
  { key: "skipped", label: "Skipped" },
  { key: "all", label: "All" },
];

const active = ref<TabKey>("read");
const items = ref<QueueListItemResponse[]>([]);
const loading = ref(false);

function queryFor(tab: TabKey): string {
  switch (tab) {
    case "read":
      return "?status=read";
    case "skipped":
      return "?status=skipped";
    case "favorites":
      return "?favorited=1";
    default:
      return "";
  }
}

async function load() {
  loading.value = true;
  try {
    const res = await api.get<{ items: QueueListItemResponse[] }>(
      `/queue/list${queryFor(active.value)}`,
    );
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
