import { useEffect, useState } from "react";
import { DisplayMode, Item, ReadStatuses } from "../types";

export const useReadStatus = (feedItems: Item[]) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("unread");
  const [readStatus, setReadStatus] = useState<ReadStatuses>({});

  // load status from localstorage
  useEffect(() => {
    const savedReadStatus = JSON.parse(
      localStorage.getItem("readStatus") || "{}",
    );
    // toast(`restored read status: ${JSON.stringify(savedReadStatus, null, 2)}`);
    setReadStatus(savedReadStatus);
  }, [feedItems]);

  // if read status is updated, save it
  useEffect(() => {
    if (Object.keys(readStatus).length > 0) {
      // toast(`saving: ${JSON.stringify(readStatus, null, 2)}`);
      localStorage.setItem("readStatus", JSON.stringify(readStatus));
    }
  }, [readStatus]);

  const toggleReadStatus = (id: string) => {
    // toast(`read status: ${id}`);
    setReadStatus((prev) => {
      const newReadStatus = { ...prev };
      newReadStatus[id] = !prev[id];
      return newReadStatus;
    });
  };

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => (prev === "unread" ? "all" : "unread"));
  };

  return {
    readStatus,
    toggleReadStatus,
    displayMode,
    toggleDisplayMode,
  };
};
