import { Enclosure, Item, Rss2JsonResponse } from "../types";

const feedFilters: ((feed: Rss2JsonResponse) => Rss2JsonResponse)[] = [];

export const modifyFeed: (feed: Rss2JsonResponse) => Rss2JsonResponse = (
  feed,
) => feedFilters.reduce((feed, f) => f(feed), feed);

const itemFilters: ((item: Item, feed: Rss2JsonResponse) => Item)[] = [];

const modifyFeedItems: (feed: Rss2JsonResponse) => Rss2JsonResponse = (
  feed,
) => {
  const items = itemFilters.reduce(
    (items, f) => items.map((item: Item) => f(item, feed)),
    feed.items,
  );
  feed.items = items;
  return feed;
};
feedFilters.push(modifyFeedItems);

const appendFeedToItem: (item: Item, feed: Rss2JsonResponse) => Item = (
  item,
  feed,
) => ({ ...item, feed: feed.feed });
itemFilters.push(appendFeedToItem);

const appendOriginalFeedToItem: (item: Item, feed: Rss2JsonResponse) => Item = (
  item,
  feed,
) => ({ ...item, feedConfig: feed.feedConfig });
itemFilters.push(appendOriginalFeedToItem);

const extractImageUrl: (text: string) => string | null = (text) => {
  const urlPattern = /^(https?:\/\/[^\s<]+?)(?=[\s<])/i;
  const match = text.match(urlPattern);

  return match ? match[1] : null;
};

const techcrunchEnclosure: (item: Item, _feed: Rss2JsonResponse) => Item = (
  item,
  _feed,
) => {
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
itemFilters.push(techcrunchEnclosure);
