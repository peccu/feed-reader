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
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/client.ts";
import ArticleFeed from "../components/ArticleFeed.vue";

const route = useRoute();
const router = useRouter();
const item = ref<QueueListItemResponse | null>(null);

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/");
}

onMounted(async () => {
  try {
    item.value = await api.get<QueueListItemResponse>(`/queue/by-article/${route.params.id}`);
  } catch {
    item.value = null;
  }
});
</script>
