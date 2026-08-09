import type {
  ArticleDetailResponse,
  QueueItemResponse,
  QueueStatsResponse,
} from "@feed-reader/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "../api/client.ts";

export const useQueueStore = defineStore("queue", () => {
  const items = ref<QueueItemResponse[]>([]);
  const stats = ref<QueueStatsResponse>({
    unread: 0,
    reading: 0,
    read: 0,
    skipped: 0,
    archived: 0,
  });
  const currentIndex = ref(0);
  const direction = ref<"forward" | "backward">("forward");
  const articleCache = ref<Map<string, ArticleDetailResponse>>(new Map());
  const loading = ref(false);

  const currentItem = computed(() => items.value[currentIndex.value] ?? null);
  const total = computed(() => items.value.length);

  async function fetchQueue() {
    loading.value = true;
    try {
      const res = await api.get<{ items: QueueItemResponse[]; total: number }>(
        "/queue?status=unread&sort=relevance&limit=50",
      );
      items.value = res.items;
      currentIndex.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    stats.value = await api.get<QueueStatsResponse>("/queue/stats");
  }

  async function fetchArticle(articleId: string): Promise<ArticleDetailResponse | null> {
    const cached = articleCache.value.get(articleId);
    if (cached) return cached;
    try {
      const article = await api.get<ArticleDetailResponse>(`/articles/${articleId}`);
      articleCache.value.set(articleId, article);
      return article;
    } catch {
      return null;
    }
  }

  async function updateStatus(id: string, status: "reading" | "read" | "skipped" | "archived") {
    await api.patch(`/queue/${id}/status`, { status });
    items.value = items.value.filter((i) => i.id !== id);
    if (currentIndex.value >= items.value.length) {
      currentIndex.value = Math.max(0, items.value.length - 1);
    }
    await fetchStats();
  }

  function navigate(delta: number) {
    const next = currentIndex.value + delta;
    if (next >= 0 && next < items.value.length) {
      currentIndex.value = next;
    }
  }

  function goTo(index: number) {
    if (index >= 0 && index < items.value.length) {
      currentIndex.value = index;
    }
  }

  function toggleDirection() {
    direction.value = direction.value === "forward" ? "backward" : "forward";
  }

  return {
    items,
    stats,
    currentIndex,
    direction,
    loading,
    articleCache,
    currentItem,
    total,
    fetchQueue,
    fetchStats,
    fetchArticle,
    updateStatus,
    navigate,
    goTo,
    toggleDirection,
  };
});
