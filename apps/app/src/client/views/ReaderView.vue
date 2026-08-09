<template>
  <div class="h-full relative">
    <ArticleFeed
      :items="items"
      list-key="single"
      :empty-text="loaded ? 'Article not found' : 'Loading…'"
    />
    <BackButton />
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
const item = ref<QueueListItemResponse | null>(null);
const loaded = ref(false);
// Stable array reference so ArticleFeed's items watcher doesn't re-fire.
const items = computed(() => (item.value ? [item.value] : []));

onMounted(async () => {
  try {
    item.value = await api.get<QueueListItemResponse>(`/queue/by-article/${route.params.id}`);
  } catch {
    item.value = null;
  } finally {
    loaded.value = true;
  }
});
</script>
