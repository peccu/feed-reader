import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FeedItem from "./FeedItem";
import FeedNavigation from "./FeedNavigation";
import FeedScrollButtons from "./FeedScrollButtons";
import FeedSettings from "./FeedSettings";
import { useFeedReader } from "./hooks/useFeedReader";

const FeedReader: React.FC = () => {
  const {
    feedUrls,
    setFeedUrls,
    feedItems,
    loading,
    error,
    setError,
    fetchFeeds,
  } = useFeedReader([
    { url: "https://www.lifehacker.jp/feed/index.xml", type: "RSS" },
    { url: "https://github.blog/feed/", type: "RSS" },
    { url: "https://www.publickey1.jp/atom.xml", type: "Atom" },
    { url: "https://dev.to/feed", type: "RSS" },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
          <FeedNavigation
            currentIndex={currentIndex}
            totalItems={feedItems.length}
            isReversed={isReversed}
            toggleDirection={toggleDirection}
          />
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

      <FeedScrollButtons handleNavClick={handleNavClick} />
    </div>
  );
};

export default FeedReader;
