<template>
  <div class="h-full flex flex-col bg-background relative">
    <BackButton />
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold flex-1">Discover</h1>
      <span v-if="mode" class="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
        {{ mode }}
      </span>
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
          :disabled="searching"
          class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >{{ searching ? '…' : 'Search' }}</button>
      </div>

      <!-- Results -->
      <div v-if="results.length > 0" class="space-y-2">
        <RouterLink
          v-for="a in results"
          :key="a.id"
          :to="`/reader/${a.id}`"
          class="block p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-medium text-foreground flex-1">{{ a.title }}</p>
            <span v-if="a.score !== null" class="shrink-0 text-xs text-muted-foreground tabular-nums">
              {{ Math.round(a.score * 100) }}%
            </span>
          </div>
          <p class="text-xs text-muted-foreground truncate mt-0.5">{{ a.url }}</p>
        </RouterLink>
      </div>

      <p v-else-if="searched && !searching" class="text-sm text-muted-foreground text-center py-8">
        No articles found
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  score: number | null;
}

const query = ref("");
const results = ref<SearchResult[]>([]);
const searched = ref(false);
const searching = ref(false);
const mode = ref<"vector" | "text" | null>(null);

async function search() {
  if (!query.value.trim() || searching.value) return;
  searching.value = true;
  try {
    const res = await api.get<{ items: SearchResult[]; mode: "vector" | "text" }>(
      `/search?q=${encodeURIComponent(query.value)}`,
    );
    results.value = res.items;
    mode.value = res.mode;
    searched.value = true;
  } finally {
    searching.value = false;
  }
}
</script>
