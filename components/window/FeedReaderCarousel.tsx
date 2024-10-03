import { Button } from "@/components/ui/button";
import React, { useEffect, useRef } from "react";
import FeedItem from "../FeedItem";
import FeedScrollButtons from "../FeedScrollButtons";
import { Item, ReadStatuses } from "../types";
import FeedReaderPager from "./FeedReaderPager";

const FeedReaderCarousel = ({
  filteredItems,
  currentIndex,
  totalItems,
  toggleDisplayMode,
  showPager = false,
  isReversed = false,
  isSourceCodeFont = false,
  readStatus = {},
  onRead = (_index) => {},
  onIndexChanged = (_prevIndex, _newIndex) => {},
}: {
  filteredItems: Item[];
  currentIndex: number;
  totalItems: number;
  toggleDisplayMode: () => void;
  showPager: boolean;
  isReversed: boolean;
  isSourceCodeFont: boolean;
  readStatus: ReadStatuses;
  onRead: (index: number) => void;
  onIndexChanged: (prevIndex: number, newIndex: number) => void;
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // handle scroll and update index
  useEffect(() => {
    const handleScroll = () => {
      const carousel = carouselRef.current;
      if (carousel) {
        const scrollPosition = carousel.scrollLeft;
        const articleWidth = carousel.offsetWidth;
        const newIndex = Math.round(scrollPosition / articleWidth);
        // console.log(`newIndex: ${newIndex}, currentIndex: ${currentIndex}, ref: ${currentIndexRef.current}`);
        newIndex !== currentIndexRef.current &&
          onIndexChanged(currentIndexRef.current, newIndex);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (carousel) {
        carousel.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // page move related functions
  const scrollToIndex = (index: number) => {
    // console.log(`index: ${index}, filteredItems.length: ${filteredItems.length}`);
    if (index < 0 || filteredItems.length <= index) {
      return;
    }
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * carouselRef.current.offsetWidth,
      });
    }
  };

  const scrollToNextItem = (direction: number) => {
    const nextIndex = currentIndex + direction;
    // console.log(`nextIndex: ${nextIndex}, filteredItems.length: ${filteredItems.length}`);
    if (nextIndex < 0 || filteredItems.length < nextIndex) {
      return;
    }
    if (carouselRef.current) {
      // should be called in on scroll event
      // onIndexChanged(nextIndex);
      scrollToIndex(nextIndex);
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: number,
  ) => {
    e.stopPropagation();
    scrollToNextItem(isReversed ? -direction : direction);
  };

  const renderAllRead = () => (
    <div className="flex items-center justify-center mx-auto">
      <div className="text-center">
        <div className="mb-2 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2">You read all articles!</h1>
          <p className="text-gray-400">
            Do you want to show already read articles?
          </p>
        </div>
        <Button onClick={toggleDisplayMode} variant="outline">
          Show all items
        </Button>
      </div>
    </div>
  );

  const renderArticle = (article: Item, index: number) => {
    const isVisible = Math.abs(index - currentIndex) <= 1;
    return (
      <div
        key={article.link}
        className="flex-shrink-0 w-full h-full snap-center overflow-hidden"
      >
        <div className="w-full h-full overflow-y-auto bg-green">
          {isVisible && !article.end && (
            <FeedItem
              key={index}
              item={article}
              isReversed={isReversed}
              isSourceCodeFont={isSourceCodeFont}
              readStatus={readStatus}
              onRead={() => onRead(index)}
            />
          )}
          {article.end && renderLastPage()}
        </div>
      </div>
    );
  };

  const renderLastPage = () => (
    <div className="flex items-center justify-center mx-auto">
      <div className="text-center">
        <div className="mb-2 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2">You read all articles!</h1>
          <p className="text-gray-400">This is the last page.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full">
      <div
        ref={carouselRef}
        className="flex w-screen h-screen overflow-x-scroll overflow-y-hidden snap-x snap-mandatory"
      >
        {filteredItems.length == 1 && totalItems > 1
          ? renderAllRead()
          : filteredItems.map(renderArticle)}
      </div>
      {showPager && (
        <FeedReaderPager
          filteredItems={filteredItems}
          currentIndex={currentIndex}
          scrollToIndex={scrollToIndex}
        />
      )}
      <FeedScrollButtons handleNavClick={handleNavClick} />
    </div>
  );
};

export default FeedReaderCarousel;
