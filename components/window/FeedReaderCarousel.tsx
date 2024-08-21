import React, { useEffect, useRef, useState } from "react";
import FeedItem from "../FeedItem";
import FeedScrollButtons from "../FeedScrollButtons";
import { Item, ReadStatuses } from "../types";
import FeedReaderPager from "./FeedReaderPager";

const FeedReaderCarousel = ({
  filteredItems,
  currentIndex,
  showPager = false,
  isReversed = false,
  readStatus = {},
  onRead = (_index) => {},
  onIndexChanged = (_prevIndex, _newIndex) => {},
}: {
  filteredItems: Item[];
  currentIndex: number;
  showPager: boolean;
  isReversed: boolean;
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
        newIndex !== currentIndexRef.current && onIndexChanged(currentIndexRef.current, newIndex);
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
    if(index < 0 || filteredItems.length <= index){
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
    if(nextIndex < 0 || filteredItems.length < nextIndex){
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

  const renderArticle = (article: Item, index: number) => {
    const isVisible = Math.abs(index - currentIndex) <= 1;
    return (
      <div
        key={article.link}
        className="flex-shrink-0 w-full h-full snap-center overflow-hidden"
      >
        <div className="w-full h-full overflow-y-auto bg-green">
          {isVisible && (
            <FeedItem
              key={index}
              item={article}
              isReversed={isReversed}
              readStatus={readStatus}
              onRead={() => onRead(index)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <div
        ref={carouselRef}
        className="flex w-screen h-screen overflow-x-scroll overflow-y-hidden snap-x snap-mandatory"
      >
        {filteredItems.map(renderArticle)}
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
