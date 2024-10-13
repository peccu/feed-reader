import { useEffect, useState } from "react";
// import { logToast } from "@/lib/logToast";
import { BookmarkStatuses, DisplayMode, Item } from "../types";

export const useBookmarkStatus = (feedItems: Item[]) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("unbookmarked");
  const [bookmarkStatus, setBookmarkStatus] = useState<BookmarkStatuses>({});

  // load status from localstorage
  useEffect(() => {
    const savedBookmarkStatus = JSON.parse(
      localStorage.getItem("bookmarkStatus") || "{}",
    );
    // logToast.log(
    //   `restored read status: ${JSON.stringify(savedBookmarkStatus, null, 2)}`,
    //);
    setBookmarkStatus(savedBookmarkStatus);
  }, [feedItems]);

  // if bookmark status is updated, save it
  useEffect(() => {
    if (Object.keys(bookmarkStatus).length > 0) {
      // logToast.log(`saving: ${JSON.stringify(bookmarkStatus, null, 2)}`);
      localStorage.setItem("bookmarkStatus", JSON.stringify(bookmarkStatus));
    }
  }, [bookmarkStatus]);

  const toggleBookmarkStatus = (id: string) => {
    setBookmarkStatus((prev) => {
      const newBookmarkStatus = { ...prev };
      newBookmarkStatus[id] = !prev[id];
      return newBookmarkStatus;
    });
  };

  const toggleDisplayMode = () => {
    setDisplayMode((prev) =>
      prev === "unbookmarked" ? "all" : "unbookmarked",
    );
  };

  return {
    bookmarkStatus,
    toggleBookmarkStatus,
    displayMode,
    toggleDisplayMode,
  };
};
