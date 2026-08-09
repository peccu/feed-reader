<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Top bar -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-border bg-background z-20 shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <!-- Nav links -->
      <div class="flex items-center gap-3 text-muted-foreground">
        <RouterLink to="/discover" class="text-sm hover:text-foreground transition-colors">探索</RouterLink>
        <RouterLink to="/notes" class="text-sm hover:text-foreground transition-colors">メモ</RouterLink>
      </div>

      <!-- Position indicator (tap to toggle direction) -->
      <button
        @click="queue.toggleDirection()"
        class="flex items-center gap-1 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        :title="queue.direction === 'forward' ? '→ 前向き (タップで逆順)' : '← 逆順 (タップで順方向)'"
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
      <p class="text-base font-medium text-foreground">キューが空です</p>
      <p class="text-sm">フィードを追加するか、URLを投稿してください</p>
      <RouterLink
        to="/settings"
        class="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
      >
        フィード管理 →
      </RouterLink>
    </div>

    <!-- Carousel -->
    <ArticleCarousel
      v-else
      class="flex-1 min-h-0"
      :current-index="queue.currentIndex"
      :total="queue.total"
      @navigate="handleNavigate"
      @index-change="queue.goTo($event)"
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
      @action="handleAction"
    />
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetailResponse, QueueItemResponse } from "@feed-reader/types";
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useFeedbackStore } from "../stores/feedback.ts";
import { useQueueStore } from "../stores/queue.ts";

const router = useRouter();
const queue = useQueueStore();
const feedback = useFeedbackStore();

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

// Prefetch articles near current index
watch(
  () => queue.currentIndex,
  (idx) => {
    for (
      let i = Math.max(0, idx - prefetchRange);
      i <= Math.min(queue.total - 1, idx + prefetchRange);
      i++
    ) {
      const item = queue.items[i];
      if (item) queue.fetchArticle(item.articleId);
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([queue.fetchQueue(), queue.fetchStats()]);
});

function handleNavigate(delta: number) {
  const actual = queue.direction === "forward" ? delta : -delta;
  queue.navigate(actual);
}

async function handleAction(type: "skip" | "like" | "dislike" | "read" | "note") {
  const item = queue.currentItem;
  if (!item) return;

  switch (type) {
    case "skip":
      await queue.updateStatus(item.id, "skipped");
      break;

    case "like":
      await feedback.sendFeedback(item.articleId, "like");
      await queue.updateStatus(item.id, "read");
      break;

    case "dislike":
      await feedback.sendFeedback(item.articleId, "dislike");
      await queue.updateStatus(item.id, "read");
      break;

    case "read":
      await queue.updateStatus(item.id, "reading");
      router.push(`/reader/${item.articleId}`);
      break;

    case "note":
      router.push(`/reader/${item.articleId}?note=1`);
      break;
  }
}
</script>
