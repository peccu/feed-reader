import { Button } from "@/components/ui/button";
import {
  Bookmark,
  Check,
  Circle,
  Repeat,
  Settings,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import FeedItem from "./FeedItem";
import FeedScrollButtons from "./FeedScrollButtons";
import FeedSettings from "./FeedSettings";
import { useBookmarkStatus } from "./hooks/useBookmark";
import { useFeedReader } from "./hooks/useFeedReader";
import { useReadStatus } from "./hooks/useReadStatus";
import PagePosition from "./PagePosition";
import { Item } from "./types";

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
  const {
    readStatus,
    toggleReadStatus,
    markAsRead,
    displayMode,
    toggleDisplayMode,
  } = useReadStatus(feedItems);
  const {
    bookmarkStatus,
    toggleBookmarkStatus,
    toggleDisplayMode: toggleBookmarkDisplayMode,
  } = useBookmarkStatus(feedItems);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  // set filtered items filter by displayMode
  useEffect(() => {
    setFilteredItems(
      feedItems.filter(
        (item) => displayMode === "all" || !readStatus[item.link],
      ),
    );
  }, [feedItems, displayMode]);

  // add/remove event listener to scroll container
  useEffect(() => {
    const updateCurrentIndex = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const itemWidth = scrollContainerRef.current.clientWidth;
        const newIndex = Math.round(scrollLeft / itemWidth);
        setCurrentIndex(newIndex);

        // Mark the current item as read
        const currentItem = filteredItems[newIndex];
        if (currentItem) {
          markAsRead(currentItem.link);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateCurrentIndex);
    }

    // Clean up event listener on unmount
    return () => {
      if (container) {
        container.removeEventListener("scroll", updateCurrentIndex);
      }
    };
  }, [filteredItems, markAsRead]);

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
      `Feedback for item ${index}: ${type}, title: ${filteredItems[index].title}`,
    );
    // Here you would typically send this feedback to a server
  };

  const handleSave = (index: number) => {
    console.log(`Saved item ${index}`);
    toast(`Saved item ${index}, title: ${filteredItems[index].title}`);
    // Here you would typically save this item to local storage or a server
    toggleBookmarkStatus(filteredItems[index].link);
    // TODO store the article itself in indexed db
  };

  const handleRead = (index: number) => {
    console.log(`Read item ${index}`);
    toast(`Read item ${index}, title: ${filteredItems[index].title}`);
    // Here you would typically mark this item as read in local storage or a server
    toggleReadStatus(filteredItems[index]?.link);
  };

  return (
    <div className="p-0 relative">
      {showSettings && (
        <FeedSettings
          feedUrls={feedUrls}
          setFeedUrls={setFeedUrls}
          setError={setError}
          fetchFeeds={fetchFeeds}
          loading={loading}
          displayMode={displayMode}
          toggleDisplayMode={toggleDisplayMode}
        />
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div
        className="overflow-x-auto scroll-auto whitespace-nowrap relative snap-x snap-mandatory"
        ref={scrollContainerRef}
      >
        <div className="inline-flex">
          {filteredItems.map((item, index) => (
            <FeedItem
              key={index}
              item={item}
              isReversed={isReversed}
              readStatus={readStatus}
              onRead={() => toggleReadStatus(item.link)}
            />
          ))}
        </div>
      </div>

      <FeedScrollButtons handleNavClick={handleNavClick} />

      {/* New fixed navigation */}
      <PagePosition
        currentIndex={currentIndex}
        totalItems={feedItems.length}
        isReversed={isReversed}
        toggleDirection={toggleDirection}
      />

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
            {bookmarkStatus[filteredItems[currentIndex]?.link] ? (
              <Bookmark fill="#fff" className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRead(currentIndex)}
          >
            {readStatus[filteredItems[currentIndex]?.link] ? (
              <Check className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedReader;
