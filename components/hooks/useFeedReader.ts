import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { modifyFeed } from "../feeds/modifier";
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
        )
          .then((response) => response.json())
          .then((json) => {
            json["_feed"] = feed;
            return json;
          })
          .then((json) => modifyFeed(json)),
      );
      const results: Rss2JsonResponse[] = await Promise.all(feedPromises);
      const allItems = results.flatMap((result) => {
        if (result.status === "ok") {
          return result.items.map((item) => ({ ...item, feed: result.feed }));
        } else {
          console.log(
            `result.status is not ok. result: ${JSON.stringify(result, null, 2)}`,
          );
          console.error(`Failed to fetch feed: ${result?.feed?.url}`);
          toast(`Failed to fetch feed: ${result?.feed?.url}`);
          return [];
        }
      });
      setFeedItems(
        allItems.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        ),
      );
      toast.success(
        `Fetched ${allItems.length} items from ${feedUrls.length} feeds`,
      );
    } catch (err: any) {
      setError("An error occurred. Please check the URL or try again later.");
      console.log(
        `An error occurred. Please check the URL or try again later. ${err.message}`,
      );
      toast.error(
        "An error occurred. Please check the URL or try again later.",
        {
          description: err.message,
        },
      );
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
