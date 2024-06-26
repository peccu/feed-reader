import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Repeat, Settings } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FeedItem from "./FeedItem";
import FeedSettings from "./FeedSettings";
import { Item, Rss2JsonResponse } from "./types";

const FeedReader = () => {
  const [feedUrls, setFeedUrls] = useState([
    { url: "https://www.lifehacker.jp/feed/index.xml", type: "RSS" },
    { url: "https://github.blog/feed/", type: "RSS" },
    { url: "https://www.publickey1.jp/atom.xml", type: "Atom" },
    { url: "https://dev.to/feed", type: "RSS" },
  ]);
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feedPromises = feedUrls.map((feed) =>
        fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
            feed.url,
          )}`,
        ).then((response) => response.json()),
      );
      const results: Rss2JsonResponse[] = await Promise.all(feedPromises);
      const allItems = results.flatMap((result) => {
        if (result.status === "ok") {
          return result.items.map((item) => {
            item.feed = result.feed;
            return item;
          });
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

  useEffect(() => {
    const updateCurrentIndex = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const itemWidth = scrollContainerRef.current.clientWidth;
        setCurrentIndex(Math.round(scrollLeft / itemWidth));
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateCurrentIndex);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", updateCurrentIndex);
      }
    };
  }, []);

  const scrollToNextItem = (direction: number) => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = currentScroll + direction * containerWidth;
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "instant",
      });
      // and scroll to top of the article
      scrollContainerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: number,
  ) => {
    e.stopPropagation();
    scrollToNextItem(isReversed ? -direction : direction);
  };

  const toggleDirection = () => {
    setIsReversed(!isReversed);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleFeedback = (index: number, type: "like" | "dislike") => {
    console.log(`Feedback for item ${index}: ${type}`);
    toast(
      `Feedback for item ${index}: ${type}, title: ${feedItems[index].title}`,
    );
    // Here you would typically send this feedback to a server
  };

  const handleSave = (index: number) => {
    console.log(`Saved item ${index}`);
    toast(`Saved item ${index}, title: ${feedItems[index].title}`);
    // Here you would typically save this item to local storage or a server
  };

  return (
    <div className="p-0 relative">
      <Card className="mb-4 relative z-20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Multi-Feed Reader</CardTitle>
          <Button onClick={toggleSettings} variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        {showSettings && (
          <CardContent>
            <FeedSettings
              feedUrls={feedUrls}
              setFeedUrls={setFeedUrls}
              setError={setError}
              fetchFeeds={fetchFeeds}
              loading={loading}
            />
          </CardContent>
        )}
        <CardContent>
          <div className="flex justify-between items-center">
            {isReversed ? (
              <span onClick={toggleDirection}>
                {currentIndex + 1} / {feedItems.length}
              </span>
            ) : (
              ""
            )}
            <Button onClick={toggleDirection} variant="outline" size="sm">
              <Repeat className="mr-2 h-4 w-4" />
              {isReversed ? "Normal Direction" : "Reverse Direction"}
            </Button>
            {!isReversed ? (
              <span onClick={toggleDirection}>
                {currentIndex + 1} / {feedItems.length}
              </span>
            ) : (
              ""
            )}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div
        className="overflow-x-auto whitespace-nowrap pb-4 relative scroll-auto snap-x snap-mandatory"
        ref={scrollContainerRef}
      >
        <div className="inline-flex">
          {feedItems.map((item, index) => (
            <FeedItem
              key={index}
              item={item}
              index={index}
              isReversed={isReversed}
              handleFeedback={handleFeedback}
              handleSave={handleSave}
            />
          ))}
        </div>
      </div>

      <!-- navigation -->
      <div
        className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start cursor-pointer z-10 opacity-25 bg-gradient-to-r from-gray-700 to-transparent"
        onClick={(e) => handleNavClick(e, -1)}
      >
        <ChevronLeft className="text-gray-500 hover:text-gray-700" size={28} />
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end cursor-pointer z-10 opacity-25 bg-gradient-to-l from-gray-700 to-transparent"
        onClick={(e) => handleNavClick(e, 1)}
      >
        <ChevronRight className="text-gray-500 hover:text-gray-700" size={28} />
      </div>
    </div>
  );
};

export default FeedReader;
