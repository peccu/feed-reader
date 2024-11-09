import { ArrowRightLeft, Repeat, Settings, ThumbsDown } from "lucide-react";
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
    fetchFeeds,
  } = useFeedReader([
    { url: "https://www.lifehacker.jp/feed/index.xml", type: "RSS" },
    { url: "https://github.blog/feed/", type: "RSS" },
    { url: "https://www.publickey1.jp/atom.xml", type: "Atom" },
    { url: "https://dev.to/feed", type: "RSS" },
    { url: "https://openrss.org/https://techcrunch.com/", type: "RSS" },
  ]);
  const {
    readStatus,
    toggleReadStatus,
    markAsReadIfNotSetUnread,
    displayMode,
    toggleDisplayMode,
  } = useReadStatus(feedItems);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  const [isReversed, setIsReversed] = useState(false);
  const [isSourceCodeFont, setIsSourceCodeFont] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const filteredItemsRef = useRef(filteredItems);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

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

  const toggleSourceCodeFont = () => {
    setIsSourceCodeFont(!isSourceCodeFont);
  };

  const onIndexChanged = (prevIndex: number, newIndex: number) => {
    console.log(
      `parent: newIndex:${newIndex},currentIndex:${currentIndexRef.current}`,
    );
    setCurrentIndex(newIndex);
    markAsReadIfNotSetUnread(filteredItemsRef.current[prevIndex].link);
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
        setCurrentIndex(0);
      },
    },
    {
      id: 2,
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick() {
        toggleSettings();
      },
    },
    {
      id: 3,
      label: "Reload all feeds",
      icon: <Repeat className="h-4 w-4" />,
      onClick() {
        fetchFeeds();
        setCurrentIndex(0);
      },
    },
    {
      id: 4,
      label: "Reverse direction",
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick() {
        toggleDirection();
      },
    },
    {
      id: 5,
      label: "Toggle all or unreads only",
      onClick() {
        toggleDisplayMode();
      },
    },
    {
      id: 6,
      label: "Toggle using SourceCodeFont",
      onClick() {
        toggleSourceCodeFont();
      },
    },
    {
      id: 7,
      label: "Stats",
      onClick() {
        // bookmarks per feed, items in duration..
      },
    },
    {
      id: 8,
      label: "Bookmarks",
      onClick() {
        // Bookmarks(Pins, RIL)
      },
    },
    {
      id: 9,
      label: "Thumbs down",
      icon: <ThumbsDown className="h-5 w-5" />,
      onClick() {
        // ThumbsDown
      },
    },
    {
      id: 10,
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
          fetchFeeds={() => {
            fetchFeeds();
            setCurrentIndex(0);
          }}
          loading={loading}
          displayMode={displayMode}
          toggleDisplayMode={toggleDisplayMode}
          toggleSettings={toggleSettings}
        />
      )}

      {!showSettings && (
        <FeedReaderCarousel
          filteredItems={filteredItems}
          showPager={false}
          currentIndex={currentIndex}
          totalItems={feedItems.length}
          toggleDisplayMode={toggleDisplayMode}
          isReversed={isReversed}
          isSourceCodeFont={isSourceCodeFont}
          readStatus={readStatus}
          onRead={(index: number) =>
            toggleReadStatus(filteredItems[index].link)
          }
          onIndexChanged={onIndexChanged}
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
      {!showSettings && (
        <ActionButtons
          currentIndex={currentIndex}
          feedItems={feedItems}
          filteredItems={filteredItems}
          isReversed={isReversed}
          readStatus={readStatus}
          toggleReadStatus={toggleReadStatus}
          toggleMenu={toggleMenu}
        />
      )}

      <ModalMenu
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        menuItems={menuItems}
      />
    </div>
  );
};

export default FeedReader;
