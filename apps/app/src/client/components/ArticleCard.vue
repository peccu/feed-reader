<template>
  <div class="flex-shrink-0 w-full h-full flex flex-col bg-background overflow-hidden">
    <div class="flex-1 overflow-y-auto">
      <div v-if="article">
        <!-- Lead / eyecatch image (full-bleed) -->
        <img
          v-if="article.leadImageUrl"
          :src="article.leadImageUrl"
          alt=""
          class="w-full max-h-72 object-cover bg-secondary"
          loading="lazy"
          @error="onImageError"
        />

        <div class="px-4 pt-4 pb-2">
          <!-- Meta -->
          <div class="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
            <span
              v-if="article.sourceType === 'rss'"
              class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
            >RSS</span>
            <span v-if="article.author" class="font-medium">{{ article.author }}</span>
            <span v-if="formattedDate">{{ formattedDate }}</span>
            <span v-if="article.wordCount">{{ article.wordCount.toLocaleString() }} words</span>
            <span class="ml-auto tabular-nums">
              Score {{ Math.round((item?.relevanceScore ?? 0) * 100) }}%
            </span>
          </div>

          <!-- Title -->
          <h1 class="text-xl font-bold leading-tight mb-3 text-foreground">
            {{ article.title }}
          </h1>

          <!-- Summary -->
          <p
            v-if="article.summary"
            class="text-sm text-muted-foreground mb-4 italic border-l-2 border-primary pl-3"
          >{{ article.summary }}</p>

          <!-- Rich HTML body -->
          <div
            v-if="article.html"
            class="article-html text-sm leading-relaxed text-foreground"
            v-html="renderedHtml"
          />

          <!-- Plain-text fallback -->
          <div
            v-else-if="article.fullText"
            class="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
          >{{ article.fullText }}</div>

          <!-- No content fallback -->
          <div v-else class="text-center py-8 text-muted-foreground text-sm">
            <p class="mb-2">Full text not available</p>
            <a
              :href="article.url"
              target="_blank"
              rel="noopener"
              class="text-primary underline underline-offset-4"
            >Open original article ↗</a>
          </div>

          <!-- Source link -->
          <div class="mt-6 pt-3 border-t border-border text-xs text-muted-foreground">
            <a
              :href="article.url"
              target="_blank"
              rel="noopener"
              class="truncate hover:text-foreground transition-colors"
            >{{ article.url }} ↗</a>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-muted-foreground text-sm">Loading…</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetailResponse, QueueItemResponse } from "@feed-reader/types";
import { computed } from "vue";
import { sanitizeHtml } from "../lib/sanitize.ts";

const props = defineProps<{
  item: QueueItemResponse | null;
  article: ArticleDetailResponse | null;
}>();

const renderedHtml = computed(() => (props.article?.html ? sanitizeHtml(props.article.html) : ""));

const formattedDate = computed(() => {
  const date = props.article?.publishedAt;
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

function onImageError(e: Event) {
  // Hide broken eyecatch images rather than showing a broken-image icon.
  (e.target as HTMLImageElement).style.display = "none";
}
</script>
