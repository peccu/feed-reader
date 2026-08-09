<template>
  <div class="h-full relative">
    <ArticleFeed
      :items="items"
      :list-key="listKey"
      :list-label="LABELS[listKey] ?? listKey"
      :start-article-id="startArticleId"
      :empty-text="emptyText"
    />
    <BackButton to="/library" />
  </div>
</template>

<script setup lang="ts">
import type { QueueListItemResponse } from "@feed-reader/types";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api/client.ts";
import ArticleFeed from "../components/ArticleFeed.vue";
import BackButton from "../components/BackButton.vue";

const route = useRoute();

const listKey = computed(() => String(route.params.key ?? "unread"));
const startArticleId = computed(() => (route.query.start ? String(route.query.start) : undefined));

const items = ref<QueueListItemResponse[]>([]);

const LABELS: Record<string, string> = {
  unread: "Unread",
  read: "Read",
  skipped: "Skipped",
  favorites: "Favorites",
  training: "Training",
  all: "All",
};
const emptyText = computed(
  () => `No ${(LABELS[listKey.value] ?? listKey.value).toLowerCase()} articles`,
);

function endpointFor(key: string): string {
  switch (key) {
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

onMounted(async () => {
  const res = await api.get<{ items: QueueListItemResponse[] }>(endpointFor(listKey.value));
  items.value = res.items;
});
</script>
