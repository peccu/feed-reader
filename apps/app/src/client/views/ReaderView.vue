<template>
  <div class="h-full relative">
    <ArticleFeed
      v-if="item"
      :items="[item]"
      list-key="single"
      empty-text="Article not found"
    />
    <div v-else class="h-full flex items-center justify-center text-muted-foreground text-sm">
      Loading…
    </div>

    <BackButton />
  </div>
</template>

<script setup lang="ts">
import type { QueueListItemResponse } from "@feed-reader/types";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api/client.ts";
import ArticleFeed from "../components/ArticleFeed.vue";
import BackButton from "../components/BackButton.vue";

const route = useRoute();
const item = ref<QueueListItemResponse | null>(null);

onMounted(async () => {
  try {
    item.value = await api.get<QueueListItemResponse>(`/queue/by-article/${route.params.id}`);
  } catch {
    item.value = null;
  }
});
</script>
