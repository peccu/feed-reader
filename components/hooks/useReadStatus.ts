import { useEffect, useRef, useState } from "react";
import { DisplayMode, Item, ReadStatuses } from "../types";
// import { logToast } from "@/lib/logToast";

export const useReadStatus = (feedItems: Item[]) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("unread");
  const [readStatus, setReadStatus] = useState<ReadStatuses>({});
  const readStatusRef = useRef(readStatus);

  useEffect(() => {
    readStatusRef.current = readStatus;
  }, [readStatus]);

  // load status from localstorage
  useEffect(() => {
    const savedReadStatus = JSON.parse(
      localStorage.getItem("readStatus") || "{}",
    );
    // logToast.log(`restored read status: ${JSON.stringify(savedReadStatus, null, 2)}`);
    setReadStatus(savedReadStatus);
  }, [feedItems]);

  // if read status is updated, save it
  useEffect(() => {
    if (Object.keys(readStatus).length > 0) {
      // logToast.log(`saving: ${JSON.stringify(readStatus, null, 2)}`);
      localStorage.setItem("readStatus", JSON.stringify(readStatus));
    }
  }, [readStatus]);

  const toggleReadStatus = (id: string) => {
    // logToast.log(`toggle read status: ${id}`);
    setReadStatus((prev) => {
      const newReadStatus = { ...prev };
      newReadStatus[id] = !prev[id];
      return newReadStatus;
    });
  };

  const markAsRead = (id: string) => {
    // logToast.log(`set as read: ${id}`);
    setReadStatus((prev) => {
      const newReadStatus = { ...prev };
      newReadStatus[id] = true;
      return newReadStatus;
    });
  };

  const markAsReadIfNotSetUnread = (id: string) => {
    // logToast.log(`mark as read if not set unread: ${id}`);
    if (
      readStatusRef.current.hasOwnProperty(id) &&
      readStatusRef.current[id] === false
    ) {
      // console.log(`This item is set as unread. skip marking as read. (${id})`);
      return;
    }
    // console.log(`This item is not set as unread. marking as read. (${id})`);
    markAsRead(id);
  };

  const markAsUnread = (id: string) => {
    // logToast.log(`set as unread: ${id}`);
    setReadStatus((prev) => {
      const newReadStatus = { ...prev };
      newReadStatus[id] = false;
      return newReadStatus;
    });
  };

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => (prev === "unread" ? "all" : "unread"));
  };

  return {
    readStatus,
    toggleReadStatus,
    markAsRead,
    markAsReadIfNotSetUnread,
    markAsUnread,
    displayMode,
    toggleDisplayMode,
  };
};
