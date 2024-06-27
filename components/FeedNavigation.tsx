import React from "react";

interface FeedNavigationProps {
  currentIndex: number;
  totalItems: number;
  isReversed: boolean;
  toggleDirection: () => void;
}

const FeedNavigation: React.FC<FeedNavigationProps> = ({
  currentIndex,
  totalItems,
  isReversed,
  toggleDirection,
}) => (
  <div className="flex justify-between items-center text-xs">
    <span onClick={toggleDirection}>
      {isReversed ? "〈 " : ""}
      {currentIndex + 1} / {totalItems}
      {isReversed ? "" : " 〉"}
    </span>
  </div>
);

export default FeedNavigation;
