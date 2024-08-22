import { Enclosure, Item, Rss2JsonResponse } from "../types";

const filters = [];

export const modifyFeed: (feed: Rss2JsonResponse) => Rss2JsonResponse = (
  feed,
) => {
  const items = filters.reduce(
    (items, f) => items.map((item: Item) => f(item)),
    feed.items,
  );
  feed.items = items;
  return feed;
};

const extractImageUrl: (text: string) => string | null = (text) => {
  const urlPattern = /^(https?:\/\/[^\s<]+?)(?=[\s<])/i;
  const match = text.match(urlPattern);

  return match ? match[1] : null;
};

const techcrunchEnclosure: (item: Item) => Item = (item) => {
  const imageUrl = extractImageUrl(item.description);
  // console.log(`item.description: ${item.description}`);
  // console.log(`imageUrl: ${imageUrl}`);
  if (imageUrl && !item.enclosure?.link) {
    item.enclosure = {
      link: imageUrl,
      type: "image/*",
    } as Enclosure;
    item.description = item.description.replace(imageUrl, "");
  }
  return item;
};
filters.push(techcrunchEnclosure);
