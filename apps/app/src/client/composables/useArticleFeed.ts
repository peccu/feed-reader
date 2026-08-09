import type { ArticleDetailResponse, QueueListItemResponse } from "@feed-reader/types";
import { computed, ref } from "vue";
import { api } from "../api/client.ts";

export type FeedItem = QueueListItemResponse;

/**
 * Shared state/behaviour for any article carousel (unread queue, library
 * lists, single article, …). The caller supplies the ordered item list; this
 * manages the current index, reading direction, lazy article-detail loading,
 * and the article actions (evaluate / read / skip / favorite).
 */
export function useArticleFeed() {
  const items = ref<FeedItem[]>([]);
  const currentIndex = ref(0);
  const articleCache = ref<Map<string, ArticleDetailResponse>>(new Map());
  const evaluations = ref<Map<string, "like" | "dislike">>(new Map());

  const total = computed(() => items.value.length);
  const currentItem = computed(() => items.value[currentIndex.value] ?? null);
  const currentEvaluation = computed(() =>
    currentItem.value ? (evaluations.value.get(currentItem.value.articleId) ?? null) : null,
  );

  const prefetchRange = 1;

  function setItems(next: FeedItem[], startArticleId?: string) {
    items.value = next;
    // Seed evaluation highlights from stored feedback so already-liked/disliked
    // articles show their state (not "unevaluated") when reopened.
    for (const it of next) {
      if (it?.feedback) evaluations.value.set(it.articleId, it.feedback);
    }
    const idx = startArticleId ? next.findIndex((i) => i.articleId === startArticleId) : 0;
    currentIndex.value = idx >= 0 ? idx : 0;
    prefetchAround(currentIndex.value);
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

  function prefetchAround(idx: number) {
    for (
      let i = Math.max(0, idx - prefetchRange);
      i <= Math.min(total.value - 1, idx + prefetchRange);
      i++
    ) {
      const item = items.value[i];
      if (item) fetchArticle(item.articleId);
    }
  }

  function articleFor(articleId: string, index: number): ArticleDetailResponse | null {
    return Math.abs(index - currentIndex.value) <= prefetchRange
      ? (articleCache.value.get(articleId) ?? null)
      : null;
  }

  function navigate(delta: number) {
    const next = currentIndex.value + delta;
    if (next >= 0 && next < total.value) currentIndex.value = next;
    prefetchAround(currentIndex.value);
  }

  /** Remove the current item from the list (after read/skip in a live queue). */
  function removeCurrent() {
    const idx = currentIndex.value;
    items.value = items.value.filter((_, i) => i !== idx);
    if (currentIndex.value >= items.value.length) {
      currentIndex.value = Math.max(0, items.value.length - 1);
    }
    prefetchAround(currentIndex.value);
  }

  return {
    items,
    currentIndex,
    total,
    currentItem,
    currentEvaluation,
    evaluations,
    setItems,
    fetchArticle,
    articleFor,
    navigate,
    removeCurrent,
  };
}
