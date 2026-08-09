import type { CreateFeedRequest, FeedResponse } from "@feed-reader/types";
import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "../api/client.ts";

export const useFeedsStore = defineStore("feeds", () => {
  const feeds = ref<FeedResponse[]>([]);

  async function fetchFeeds() {
    const res = await api.get<{ items: FeedResponse[] }>("/feeds");
    feeds.value = res.items;
  }

  async function addFeed(req: CreateFeedRequest) {
    const feed = await api.post<FeedResponse>("/feeds", req);
    feeds.value.push(feed);
    return feed;
  }

  async function deleteFeed(id: string) {
    await api.delete(`/feeds/${id}`);
    feeds.value = feeds.value.filter((f) => f.id !== id);
  }

  return { feeds, fetchFeeds, addFeed, deleteFeed };
});
