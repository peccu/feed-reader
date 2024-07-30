import { Repeat, Settings } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
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
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const listRef = useRef<typeof List>(null);

  // set window dimensions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateDimensions = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);

      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  // set filtered items filter by displayMode
  useEffect(() => {
    setFilteredItems(
      feedItems.filter(
        (item) => displayMode === "all" || !readStatus[item.link],
      ),
    );
  }, [feedItems, displayMode]);

  // set current index
  const handleItemsRendered = useCallback(
    ({ visibleStartIndex }: { visibleStartIndex: number }) => {
      /* toast(`items rendered: ${visibleStartIndex}`); */
      if (visibleStartIndex == currentIndex) {
        return;
      }
      const currentItem = filteredItems[visibleStartIndex];
      if (currentItem) {
        markAsRead(currentItem.link);
      }
      setCurrentIndex(visibleStartIndex);
    },
    [],
  );

  const scrollToNextItem = (direction: number) => {
    const list = listRef.current;
    if (list) {
      const nextIndex = currentIndex + direction;
      setCurrentIndex(nextIndex);
      listRef.current?.scrollToItem(nextIndex);
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

  const Column = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => (
    <div
      className="flex-shrink-0 w-full h-full snap-center overflow-hidden"
      style={style}
    >
      <div className="w-full h-full overflow-y-auto bg-green">
        {/*JSON.stringify(style, null, 2)*/}
        {/* {JSON.stringify(filteredItems[index], null, 2)} */}
        {/*<div>{`Row ${index}`}</div>*/}
        <FeedItem
          key={index}
          item={filteredItems[index]}
          isReversed={isReversed}
          readStatus={readStatus}
          onRead={() => toggleReadStatus(filteredItems[index].link)}
        />
      </div>
    </div>
  );

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
        <List
          className="flex w-screen h-screen overflow-x-scroll overflow-y-hidden snap-x snap-mandatory"
          height={dimensions.height}
          itemSize={dimensions.width}
          layout="horizontal"
          width={dimensions.width}
          ref={listRef}
          itemCount={filteredItems.length}
          overscanCount={1}
          onItemsRendered={handleItemsRendered}
        >
          {Column}
        </List>
      )}

      {!showSettings && <FeedScrollButtons handleNavClick={handleNavClick} />}

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
