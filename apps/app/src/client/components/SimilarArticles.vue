<template>
  <div v-if="items.length > 0" class="mt-6 pt-3 border-t border-border">
    <h2 class="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">
      More like this
    </h2>
    <div class="space-y-1">
      <RouterLink
        v-for="a in items"
        :key="a.articleId"
        :to="`/reader/${a.articleId}`"
        class="block p-2 -mx-2 rounded-lg hover:bg-accent transition-colors"
      >
        <div class="flex items-start gap-2">
          <p class="flex-1 text-sm text-foreground line-clamp-2">{{ a.title }}</p>
          <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
            {{ Math.round(a.similarity * 100) }}%
          </span>
        </div>
        <p class="text-xs text-muted-foreground truncate mt-0.5">{{ hostname(a.url) }}</p>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ListResponse, SimilarArticleResponse } from "@feed-reader/types";
import { ref, watch } from "vue";
import { api } from "../api/client.ts";
import { hostname } from "../lib/url.ts";

const props = defineProps<{ articleId: string }>();
const items = ref<SimilarArticleResponse[]>([]);

async function load(id: string) {
  items.value = [];
  try {
    const res = await api.get<ListResponse<SimilarArticleResponse>>(
      `/articles/${id}/similar?limit=5`,
    );
    items.value = res.items;
  } catch {
    // No embedding for this article (404) or request failed — show nothing.
  }
}

watch(() => props.articleId, load, { immediate: true });
</script>
