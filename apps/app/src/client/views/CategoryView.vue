<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">カテゴリ</h1>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
      >
        <span
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: cat.color ?? '#888' }"
        />
        <div class="flex-1">
          <p class="text-sm font-medium text-foreground">{{ cat.name }}</p>
          <p v-if="cat.description" class="text-xs text-muted-foreground">{{ cat.description }}</p>
        </div>
        <span v-if="cat.isAutoCluster" class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
          自動
        </span>
      </div>
      <p v-if="categories.length === 0" class="text-sm text-muted-foreground text-center py-8">
        カテゴリがありません
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryResponse } from "@feed-reader/types";
import { onMounted, ref } from "vue";
import { api } from "../api/client.ts";

const categories = ref<CategoryResponse[]>([]);

onMounted(async () => {
  const res = await api.get<{ items: CategoryResponse[] }>("/categories");
  categories.value = res.items;
});
</script>
