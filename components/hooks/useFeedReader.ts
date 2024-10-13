import { logToast } from "@/lib/logToast";
import { useCallback, useEffect, useState } from "react";
import { modifyFeed } from "../feeds/modifier";
import { FeedConfig, Item, Rss2JsonResponse } from "../types";

export const useFeedReader = (initialFeedUrls: FeedConfig[]) => {
  const [feedUrls, setFeedUrls] = useState(initialFeedUrls);
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const feedPromises = feedUrls.map((feed) =>
        fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
        )
          .then((response) => response.json())
          .then((json) => {
            json["feedConfig"] = feed;
            return json;
          }),
      );
      const results: Rss2JsonResponse[] = await Promise.all(feedPromises);
      const allItems = results.flatMap((result) => {
        if (result.status === "ok") {
          const modified = modifyFeed(result);
          console.log("before modified", result);
          console.log("after modified", modified);
          return modified.items;
        } else {
          // console.log(
          //   `result.status is not ok. result: ${JSON.stringify(result, null, 2)}`,
          // );
          logToast.error(`Failed to fetch feed: ${result?.feed?.url}`);
          return [];
        }
      });
      setFeedItems([
        ...allItems.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        ),
        {
          end: true,
        } as Item,
      ]);
      logToast.success(
        `Fetched ${allItems.length} items from ${feedUrls.length} feeds`,
      );
    } catch (err: any) {
      logToast.error(
        "An error occurred. Please check the URL or try again later.",
        err.message,
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
    fetchFeeds,
  };
};
