import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface FeedScrollButtonsProps {
  handleNavClick: (
    e: React.MouseEvent<HTMLDivElement>,
    direction: number,
  ) => void;
}

const FeedScrollButtons: React.FC<FeedScrollButtonsProps> = ({
  handleNavClick,
}) => (
  <>
    <div
      className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start cursor-pointer z-10 opacity-25 bg-gradient-to-r from-gray-700 to-transparent"
      onClick={(e) => handleNavClick(e, -1)}
    >
      <ChevronLeft className="text-gray-500 hover:text-gray-700" size={28} />
    </div>
    <div
      className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end cursor-pointer z-10 opacity-25 bg-gradient-to-l from-gray-700 to-transparent"
      onClick={(e) => handleNavClick(e, 1)}
    >
      <ChevronRight className="text-gray-500 hover:text-gray-700" size={28} />
    </div>
  </>
);
export default FeedScrollButtons;
