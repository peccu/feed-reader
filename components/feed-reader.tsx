import { Repeat, Settings } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ActionButtons from "./ActionButtons";
import FeedSettings from "./FeedSettings";
import { useFeedReader } from "./hooks/useFeedReader";
import { useReadStatus } from "./hooks/useReadStatus";
import ModalMenu from "./ModalMenu";
import PagePosition from "./PagePosition";
import { Item, MenuItem } from "./types";
import FeedReaderCarousel from "./window/FeedReaderCarousel";

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
    markAsReadIfNotSetUnread,
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
      label: "Reverse direction",
      icon: <Repeat className="h-4 w-4" />,
      onClick() {
        toggleDirection();
      },
    },
    {
      id: 3,
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick() {
        //alert("open settings");
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

      {!showSettings && (
        <FeedReaderCarousel
          filteredItems={filteredItems}
          showPager={false}
          currentIndex={currentIndex}
          isReversed={isReversed}
          readStatus={readStatus}
          onRead={(index: number) =>
            toggleReadStatus(filteredItems[index].link)
          }
          onIndexChanged={setCurrentIndex}
        />
      )}

      {/* New fixed navigation */}
      {!showSettings && (
        <PagePosition
          currentIndex={currentIndex}
          filteredItems={filteredItems.length}
          totalItems={feedItems.length}
          isReversed={isReversed}
          toggleDirection={toggleDirection}
        />
      )}

      {/* New fixed action buttons */}
      <ActionButtons
        currentIndex={currentIndex}
        feedItems={feedItems}
        filteredItems={filteredItems}
        isReversed={isReversed}
        readStatus={readStatus}
        toggleReadStatus={toggleReadStatus}
        toggleMenu={toggleMenu}
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
