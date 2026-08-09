<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold">Settings / Feeds</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Add feed -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Feed</h2>
        <div class="flex gap-2">
          <input
            v-model="newFeedUrl"
            type="url"
            placeholder="https://example.com/feed.xml"
            class="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            @click="addFeed()"
            :disabled="!newFeedUrl"
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>

      <!-- Feed list -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Feeds ({{ feedsStore.feeds.length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="feed in feedsStore.feeds"
            :key="feed.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ feed.title }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ feed.url }}</p>
              <p v-if="feed.lastPolledAt" class="text-xs text-muted-foreground/60">
                Last fetched: {{ new Date(feed.lastPolledAt).toLocaleString('en-US') }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="feed.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-muted-foreground'"
              >{{ feed.isActive ? 'Active' : 'Inactive' }}</span>
              <button
                @click="feedsStore.deleteFeed(feed.id)"
                class="text-muted-foreground hover:text-destructive transition-colors text-sm"
              >✕</button>
            </div>
          </div>
          <p v-if="feedsStore.feeds.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No feeds registered
          </p>
        </div>
      </section>

      <!-- URL ingest -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Submit URL</h2>
        <div class="flex gap-2">
          <input
            v-model="ingestUrl"
            type="url"
            placeholder="https://example.com/article"
            class="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            @click="ingestArticle()"
            :disabled="!ingestUrl || submitting"
            class="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50"
          >
            Submit
          </button>
        </div>
        <div v-if="pendingCount > 0" class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span class="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          {{ pendingCount }} job{{ pendingCount === 1 ? '' : 's' }} processing — articles will appear in queue shortly
        </div>
        <p v-if="ingestMessage" class="text-xs text-green-600 dark:text-green-400 mt-2">{{ ingestMessage }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IngestJobResponse } from "@feed-reader/types";
import { onMounted, onUnmounted, ref } from "vue";
import { api } from "../api/client.ts";
import { useFeedsStore } from "../stores/feeds.ts";

const feedsStore = useFeedsStore();
const newFeedUrl = ref("");
const ingestUrl = ref("");
const ingestMessage = ref("");
const submitting = ref(false);
const pendingCount = ref(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  feedsStore.fetchFeeds();
  fetchPendingCount();
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

async function fetchPendingCount() {
  try {
    const res = await api.get<{ count: number }>("/articles/ingest/pending");
    pendingCount.value = res.count;
    if (res.count > 0 && !pollTimer) {
      pollTimer = setInterval(async () => {
        const r = await api.get<{ count: number }>("/articles/ingest/pending");
        pendingCount.value = r.count;
        if (r.count === 0 && pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 5000);
    }
  } catch {
    // ignore
  }
}

async function addFeed() {
  if (!newFeedUrl.value) return;
  await feedsStore.addFeed({ url: newFeedUrl.value, title: newFeedUrl.value });
  newFeedUrl.value = "";
}

async function ingestArticle() {
  if (!ingestUrl.value || submitting.value) return;
  submitting.value = true;
  try {
    const res = await api.post<IngestJobResponse>("/articles/ingest/url", { url: ingestUrl.value });
    ingestMessage.value = `Queued (job: ${res.jobId.slice(0, 8)}…)`;
    ingestUrl.value = "";
    pendingCount.value += 1;
    fetchPendingCount();
  } finally {
    submitting.value = false;
  }
}
</script>
