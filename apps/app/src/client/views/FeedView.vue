<template>
  <div class="h-full relative">
    <ArticleFeed
      :items="items"
      :list-key="listKey"
      :start-article-id="startArticleId"
      :empty-text="emptyText"
    />

    <!-- Floating back button (thumb zone) -->
    <button
      @click="goBack"
      aria-label="Back"
      class="absolute left-3 z-40 flex items-center justify-center w-11 h-11 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg text-muted-foreground hover:text-foreground"
      style="bottom: calc(env(safe-area-inset-bottom) + 4.75rem)"
    >
      <ArrowLeft :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { QueueListItemResponse } from "@feed-reader/types";
import { ArrowLeft } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/client.ts";
import ArticleFeed from "../components/ArticleFeed.vue";

const route = useRoute();
const router = useRouter();

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

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/library");
}

onMounted(async () => {
  const res = await api.get<{ items: QueueListItemResponse[] }>(endpointFor(listKey.value));
  items.value = res.items;
});
</script>
