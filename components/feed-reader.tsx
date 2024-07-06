import React, { useEffect, useRef, useState } from "react";
import ActionButtons from "./ActionButtons";
import FeedItem from "./FeedItem";
import FeedScrollButtons from "./FeedScrollButtons";
import FeedSettings from "./FeedSettings";
import { useFeedReader } from "./hooks/useFeedReader";
import { useReadStatus } from "./hooks/useReadStatus";
import ModalMenu from "./ModalMenu";
import PagePosition from "./PagePosition";
import { Item, MenuItem } from "./types";

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
        if (newIndex === currentIndex) {
          return;
        }
        // toast(`index changed: ${currentIndex} -> ${newIndex}`);

        // Mark the current item as read
        const currentItem = filteredItems[currentIndex];
        if (currentItem) {
          markAsRead(currentItem.link);
        }
        setCurrentIndex(newIndex);
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

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuItems: MenuItem[] = [
    {
      id: 1,
      label: "Home",
      onClick() {
        alert("home");
      },
    },
    {
      id: 2,
      label: "Profile",
      onClick() {
        alert("profile");
      },
    },
    {
      id: 3,
      label: "Settings",
      onClick() {
        alert("open settings");
        toggleSettings();
      },
    },
    {
      id: 4,
      label: "Help",
      onClick() {
        alert("help");
      },
    },
  ];

  return (
    <div className="relative p-0">
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

      {error && <p className="mb-4 text-red-500">{error}</p>}

      <div
        className="overflow-x-auto relative whitespace-nowrap scroll-auto snap-x snap-mandatory"
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
        filteredItems={filteredItems.length}
        totalItems={feedItems.length}
        isReversed={isReversed}
        toggleDirection={toggleDirection}
      />

      {/* New fixed action buttons */}
      <ActionButtons
        currentIndex={currentIndex}
        feedItems={feedItems}
        filteredItems={filteredItems}
        isReversed={isReversed}
        readStatus={readStatus}
        toggleReadStatus={toggleReadStatus}
        toggleMenu={toggleMenu}
        toggleDirection={toggleDirection}
        toggleSettings={toggleSettings}
      />

      <ModalMenu
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        menuItems={menuItems}
      />
    </div>
  );
};

export default FeedReader;
