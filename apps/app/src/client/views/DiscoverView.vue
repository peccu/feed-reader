<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">Discover</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Search -->
      <div class="flex gap-2">
        <input
          v-model="query"
          @keydown.enter="search()"
          type="search"
          placeholder="Search articles..."
          class="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          @click="search()"
          class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
        >Search</button>
      </div>

      <!-- Results -->
      <div v-if="results.length > 0" class="space-y-2">
        <RouterLink
          v-for="a in results"
          :key="a.id"
          :to="`/reader/${a.id}`"
          class="block p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
        >
          <p class="text-sm font-medium text-foreground">{{ a.title }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ a.url }}</p>
        </RouterLink>
      </div>

      <p v-else-if="searched" class="text-sm text-muted-foreground text-center py-8">
        No articles found
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { api } from "../api/client.ts";

interface SearchResult {
  id: string;
  title: string;
  url: string;
}

const query = ref("");
const results = ref<SearchResult[]>([]);
const searched = ref(false);

async function search() {
  if (!query.value.trim()) return;
  const res = await api.get<{ items: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query.value)}`,
  );
  results.value = res.items;
  searched.value = true;
}
</script>
