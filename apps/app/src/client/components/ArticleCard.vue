<template>
  <div
    class="flex-shrink-0 w-full h-full snap-start flex flex-col bg-background overflow-hidden"
  >
    <!-- Article content area -->
    <div class="flex-1 overflow-y-auto px-4 pt-4 pb-2">
      <div v-if="article">
        <!-- Meta -->
        <div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <span v-if="article.sourceType === 'rss'" class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">RSS</span>
          <span>{{ formattedDate }}</span>
          <span v-if="article.wordCount">{{ article.wordCount.toLocaleString() }} words</span>
          <span class="ml-auto">
            Score {{ Math.round((item?.relevanceScore ?? 0) * 100) }}%
          </span>
        </div>

        <!-- Title -->
        <h1 class="text-xl font-bold leading-tight mb-4 text-foreground">
          {{ article.title }}
        </h1>

        <!-- Summary -->
        <p v-if="article.summary" class="text-sm text-muted-foreground mb-4 italic border-l-2 border-primary pl-3">
          {{ article.summary }}
        </p>

        <!-- Full text -->
        <div
          v-if="article.fullText"
          class="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
        >{{ article.fullText }}</div>

        <!-- No text fallback -->
        <div v-else class="text-center py-8 text-muted-foreground text-sm">
          <p class="mb-2">Full text not available</p>
          <a
            :href="article.url"
            target="_blank"
            rel="noopener"
            class="text-primary underline underline-offset-4"
          >Open original article ↗</a>
        </div>
      </div>

      <!-- Loading state -->
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-muted-foreground text-sm">Loading...</div>
      </div>
    </div>

    <!-- Source link -->
    <div v-if="article" class="px-4 pb-2 text-xs text-muted-foreground flex items-center gap-2">
      <a
        :href="article.url"
        target="_blank"
        rel="noopener"
        class="truncate hover:text-foreground transition-colors"
      >{{ article.url }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetailResponse, QueueItemResponse } from "@feed-reader/types";
import { computed } from "vue";

const props = defineProps<{
  item: QueueItemResponse | null;
  article: ArticleDetailResponse | null;
}>();

const formattedDate = computed(() => {
  const date = props.article?.publishedAt;
  if (!date) return "";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});
</script>
