import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Repeat, Settings, ThumbsDown, ThumbsUp } from "lucide-react";
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
      {showSettings && (
        <>
          <Card className="mb-4 relative z-20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Multi-Feed Reader</CardTitle>
            </CardHeader>
            <CardContent>
              <FeedSettings
                feedUrls={feedUrls}
                setFeedUrls={setFeedUrls}
                setError={setError}
                fetchFeeds={fetchFeeds}
                loading={loading}
              />
            </CardContent>
          </Card>
        </>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div
        className="overflow-x-auto scroll-auto whitespace-nowrap relative snap-x snap-mandatory"
        ref={scrollContainerRef}
      >
        <div className="inline-flex">
          {feedItems.map((item, index) => (
            <FeedItem key={index} item={item} isReversed={isReversed} />
          ))}
        </div>
      </div>

      <FeedScrollButtons handleNavClick={handleNavClick} />

      {/* New fixed navigation */}
      <div
        className={`fixed top-0 z-30 p-2 rounded-lg shadow-lg ${isReversed ? "right-0" : "left-0"}`}
      >
        <FeedNavigation
          currentIndex={currentIndex}
          totalItems={feedItems.length}
          isReversed={isReversed}
          toggleDirection={toggleDirection}
        />
      </div>

      {/* New fixed action buttons */}
      <div
        className={`fixed bottom-4 z-30 bg-background/80 backdrop-blur-sm p-1 rounded-sm shadow-lg ${isReversed ? "left-4" : "right-4"}`}
      >
        <div className={`flex gap-3 ${isReversed ? "flex-row-reverse" : ""}`}>
          <Button variant="outline" size="sm" onClick={toggleDirection}>
            <Repeat className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleSettings}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback(currentIndex, "like")}
          >
            <ThumbsUp className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback(currentIndex, "dislike")}
          >
            <ThumbsDown className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(currentIndex)}
          >
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedReader;
