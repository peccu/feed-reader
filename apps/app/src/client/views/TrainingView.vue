<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">Training</h1>
      <span v-if="items.length" class="text-xs text-muted-foreground tabular-nums">
        {{ Math.min(index + 1, items.length) }} / {{ items.length }}
      </span>
    </div>

    <!-- Current borderline article -->
    <div v-if="current" class="flex-1 overflow-y-auto p-4">
      <p class="text-xs text-muted-foreground mb-2">
        Borderline score
        <span class="font-semibold text-foreground">{{ Math.round(current.relevanceScore * 100) }}%</span>
        — rate it to sharpen your preferences.
      </p>
      <img
        v-if="current.leadImageUrl"
        :src="current.leadImageUrl"
        alt=""
        class="w-full max-h-56 object-cover rounded-lg mb-3 bg-secondary"
        loading="lazy"
        @error="hideImg"
      />
      <h2 class="text-lg font-bold leading-snug text-foreground mb-2">{{ current.title }}</h2>
      <p class="text-xs text-muted-foreground truncate mb-4">{{ current.url }}</p>
      <RouterLink
        :to="`/reader/${current.articleId}`"
        class="text-sm text-primary underline underline-offset-4"
      >Open full article →</RouterLink>
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-8 text-center">
      <span class="text-5xl">🎯</span>
      <p class="text-base font-medium text-foreground">All caught up</p>
      <p class="text-sm">No borderline articles to train on right now.</p>
    </div>

    <!-- Evaluation bar (evaluation only — does not change read status) -->
    <div
      v-if="current"
      class="flex items-center justify-around gap-2 px-4 py-3 border-t border-border bg-background"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <button
        @click="evaluate('dislike')"
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
      >
        <ThumbsDown :size="20" /> <span class="text-sm font-medium">Dislike</span>
      </button>
      <button
        @click="skip()"
        class="px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground text-sm"
      >Skip</button>
      <button
        @click="evaluate('like')"
        class="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-border text-muted-foreground hover:text-yellow-500 hover:border-yellow-500 transition-colors"
      >
        <ThumbsUp :size="20" /> <span class="text-sm font-medium">Like</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QueueListItemResponse } from "@feed-reader/types";
import { ThumbsDown, ThumbsUp } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { api } from "../api/client.ts";
import { useFeedbackStore } from "../stores/feedback.ts";

const feedback = useFeedbackStore();
const items = ref<QueueListItemResponse[]>([]);
const index = ref(0);

const current = computed(() => items.value[index.value] ?? null);

onMounted(async () => {
  const res = await api.get<{ items: QueueListItemResponse[] }>("/queue/training");
  items.value = res.items;
});

async function evaluate(type: "like" | "dislike") {
  const item = current.value;
  if (!item) return;
  await feedback.sendFeedback(item.articleId, type);
  index.value += 1;
}

function skip() {
  index.value += 1;
}

function hideImg(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}
</script>
