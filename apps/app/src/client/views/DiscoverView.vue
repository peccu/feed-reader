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

    <div class="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
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
          <p class="text-xs text-muted-foreground truncate mt-0.5">{{ hostname(a.url) }}</p>
        </RouterLink>
      </div>

      <p v-else-if="searched && !searching" class="text-sm text-muted-foreground text-center py-8">
        No articles found
      </p>
    </div>

    <!-- Floating search bar (bottom, thumb zone; rounded capsule) -->
    <div
      class="absolute left-3 right-3 z-40 flex items-center gap-2 p-1.5 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg"
      style="bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <Search :size="18" class="ml-2 shrink-0 text-muted-foreground" />
      <input
        v-model="query"
        @keydown.enter="onEnter"
        type="search"
        placeholder="Search articles..."
        class="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        @click="search()"
        :disabled="searching"
        class="shrink-0 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm disabled:opacity-50 active:scale-95 transition-transform"
      >{{ searching ? '…' : 'Search' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";
import { hostname } from "../lib/url.ts";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  score: number | null;
}

const route = useRoute();
const router = useRouter();
const query = ref("");
const results = ref<SearchResult[]>([]);
const searched = ref(false);
const searching = ref(false);
const mode = ref<"vector" | "text" | null>(null);

// Don't submit while an IME composition is in progress (Japanese conversion).
function onEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return;
  search();
}

async function search() {
  if (!query.value.trim() || searching.value) return;
  searching.value = true;
  // Persist the query in the URL so it (and the results) restore on back.
  router.replace({ query: { q: query.value } });
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

onMounted(() => {
  const q = route.query.q;
  if (typeof q === "string" && q.trim()) {
    query.value = q;
    search();
  }
});
</script>
