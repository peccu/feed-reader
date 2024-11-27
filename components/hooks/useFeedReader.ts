import { logToast } from "@/lib/logToast";
import { useCallback, useEffect, useState } from "react";
import { modifyFeed } from "../feeds/modifier";
import { FeedConfig, Item, Rss2JsonResponse } from "../types";

interface FetchResult {
  feed: FeedConfig;
  result: Rss2JsonResponse | Response;
  error: Error | null;
}

export const useFeedReader = (initialFeedUrls: FeedConfig[]) => {
  const [feedUrls, setFeedUrls] = useState(initialFeedUrls);
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const feedPromises = feedUrls.map(async (feed) => {
        try {
          const result = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`,
          )
            .then((response) => response.json())
            .then((json) => {
              json["feedConfig"] = feed;
              return { result: json, error: null };
            })
            .catch((error) => {
              return {
                result: new Response(null, { status: 500 }),
                error: error,
              };
            });
          return { feed, ...result };
        } catch (error) {
          return {
            feed,
            result: new Response(null, { status: 500 }),
            error: error as Error,
          };
        }
      });
      const results: FetchResult[] = await Promise.all(feedPromises);
      const allItems = results.flatMap((result) => {
        if (
          !(result.result instanceof Response) &&
          result.result.status === "ok"
        ) {
          const modified = modifyFeed(result.result);
          console.log("before modified", result);
          console.log("after modified", modified);
          return modified.items;
        } else if (result.result instanceof Response) {
          logToast.error(
            `Failed to fetch feed ( ${result.feed?.url} ) : ${result.error} : ${JSON.stringify(result)}`,
          );
          return [];
        } else {
          logToast.error(
            `Failed to fetch feed ( ${result.feed?.url} ) : ${result.result.message}`,
          );
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
