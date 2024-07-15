export interface Rss2JsonResponse {
  status: string;
  feed: Feed;
  items: Item[];
}

interface Feed {
  url: string;
  title: string;
  link: string;
  author: string;
  description: string;
  image: string;
}

export interface Item {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  enclosure: Enclosure;
  categories: string[];
  feed?: Feed;
}

export interface ReadStatuses {
  [key: string]: boolean;
}

export interface BookmarkStatuses {
  [key: string]: boolean;
}

interface Enclosure {
  link: string;
  type: string;
  length?: string; // Optional as it might not be present in all responses
}

export type DisplayMode = "unread" | "unbookmarked" | "all";

export interface MenuItem {
  id: number;
  label: string;
  icon?: JSX.Element;
  onClick: () => void;
}
