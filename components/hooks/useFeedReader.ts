import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Item, Rss2JsonResponse } from "../types";
type Feed = { url: string; type: string };

export const useFeedReader = (initialFeedUrls: Feed[]) => {
  const [feedUrls, setFeedUrls] = useState(initialFeedUrls);
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feedPromises = feedUrls.map((feed) =>
        fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
        ).then((response) => response.json()),
      );
      const results: Rss2JsonResponse[] = await Promise.all(feedPromises);
      const allItems = results.flatMap((result) => {
        if (result.status === "ok") {
          return result.items.map((item) => ({ ...item, feed: result.feed }));
        } else {
          console.error(`Failed to fetch feed: ${result.feed.url}`);
          toast(`Failed to fetch feed: ${result.feed.url}`);
          return [];
        }
      });
      setFeedItems(
        allItems.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        ),
      );
      toast(`Fetched ${allItems.length} items from ${feedUrls.length} feeds`);
    } catch (err) {
      setError("An error occurred. Please check the URL or try again later.");
      toast("An error occurred. Please check the URL or try again later.");
    } finally {
      setLoading(false);
    }
  }, [feedUrls]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  useEffect(() => {
    const storedUrls = localStorage.getItem("feedUrls");
    if (storedUrls) {
      setFeedUrls(JSON.parse(storedUrls));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("feedUrls", JSON.stringify(feedUrls));
  }, [feedUrls]);

  return {
    feedUrls,
    setFeedUrls,
    feedItems,
    loading,
    error,
    setError,
    fetchFeeds,
  };
};
