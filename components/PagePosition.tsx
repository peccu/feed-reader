import React from "react";

interface FeedNavigationProps {
  currentIndex: number;
  filteredItems: number;
  totalItems: number;
  isReversed: boolean;
  toggleDirection: () => void;
}

const PagePosition: React.FC<FeedNavigationProps> = ({
  currentIndex,
  filteredItems,
  totalItems,
  isReversed,
  toggleDirection,
}) => (
  <div
    className={`fixed top-0 z-30 p-2 rounded-lg shadow-lg ${isReversed ? "right-0" : "left-0"}`}
  >
    <div className="flex justify-between items-center text-xs">
      <span onClick={toggleDirection}>
        {isReversed ? "〈 " : ""}
        {currentIndex + 1} / {filteredItems} ({totalItems})
        {isReversed ? "" : " 〉"}
      </span>
    </div>
  </div>
);

export default PagePosition;
