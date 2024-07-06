import { Button } from "@/components/ui/button";
import {
  Bookmark,
  Check,
  Circle,
  Menu,
  Repeat,
  Settings,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useBookmarkStatus } from "./hooks/useBookmark";
import { Item, ReadStatuses } from "./types";

interface ActionButtonsProps {
  currentIndex: number;
  feedItems: Item[];
  filteredItems: Item[];
  isReversed: boolean;
  readStatus: ReadStatuses;
  toggleReadStatus: (link: string) => void;
  toggleMenu: () => void;
  toggleDirection: () => void;
  toggleSettings: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  currentIndex,
  feedItems,
  filteredItems,
  isReversed,
  readStatus,
  toggleReadStatus,
  toggleMenu,
  toggleDirection,
  toggleSettings,
}) => {
  const {
    bookmarkStatus,
    toggleBookmarkStatus,
    toggleDisplayMode: toggleBookmarkDisplayMode,
  } = useBookmarkStatus(feedItems);

  const handleFeedback = (index: number, type: "like" | "dislike") => {
    console.log(`Feedback for item ${index}: ${type}`);
    toast(
      `Feedback for item ${index}: ${type}, title: ${filteredItems[index].title}`,
    );
    // Here you would typically send this feedback to a server
  };

  const handleSave = (index: number) => {
    console.log(`Saved item ${index}`);
    toast(`Saved item ${index}, title: ${filteredItems[index].title}`);
    // Here you would typically save this item to local storage or a server
    toggleBookmarkStatus(filteredItems[index].link);
    // TODO store the article itself in indexed db
  };

  const handleRead = (index: number) => {
    console.log(`Read item ${index}`);
    toast(`Read item ${index}, title: ${filteredItems[index].title}`);
    // Here you would typically mark this item as read in local storage or a server
    toggleReadStatus(filteredItems[index]?.link);
  };

  return (
    <div
      className={`fixed bottom-4 z-30 bg-background/80 backdrop-blur-sm p-1 rounded-sm shadow-lg ${
        isReversed ? "left-4" : "right-4"
      }`}
    >
      <div className={`flex gap-3 ${isReversed ? "flex-row-reverse" : ""}`}>
        <Button variant="outline" size="sm" onClick={toggleDirection}>
          <Repeat className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={toggleSettings}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={toggleMenu}>
          <Menu className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(currentIndex, "like")}
        >
          <ThumbsUp className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(currentIndex, "dislike")}
        >
          <ThumbsDown className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSave(currentIndex)}
        >
          {bookmarkStatus[filteredItems[currentIndex]?.link] ? (
            <Bookmark fill="#fff" className="h-5 w-5" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRead(currentIndex)}
        >
          {readStatus[filteredItems[currentIndex]?.link] ? (
            <Check className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
