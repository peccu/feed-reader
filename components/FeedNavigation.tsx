import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react";
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
  <div className="flex justify-between items-center">
    {isReversed && (
      <span>
        {currentIndex + 1} / {totalItems}
      </span>
    )}
    <Button onClick={toggleDirection} variant="outline" size="sm">
      <Repeat className="mr-2 h-4 w-4" />
      {isReversed ? "Normal Direction" : "Reverse Direction"}
    </Button>
    {!isReversed && (
      <span>
        {currentIndex + 1} / {totalItems}
      </span>
    )}
  </div>
);

export default FeedNavigation;
