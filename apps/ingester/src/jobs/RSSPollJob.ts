import { FeedId, isDueForPolling } from "@feed-reader/domain";
import RSSParser from "rss-parser";
import { feedRepo } from "../db.ts";
import { firstImageSrc, firstImageUrlInText } from "../pipeline/htmlParser.ts";
import { ingestUrl } from "../pipeline/ingestUrl.ts";

// Parse common media namespaces so we can surface eyecatch images from feeds
// that use <media:content> / <media:thumbnail> (legacy relied on enclosure).
const parser = new RSSParser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

interface MediaNode {
  $?: { url?: string; medium?: string; type?: string };
}
interface RssItemLike {
  enclosure?: { url?: string; type?: string };
  mediaThumbnail?: MediaNode;
  mediaContent?: MediaNode[];
  "content:encoded"?: string;
  content?: string;
  contentSnippet?: string;
}

/** Resolve an eyecatch image URL from an RSS item, mirroring the legacy priority. */
function imageFromRssItem(item: RssItemLike): string | undefined {
  const enc = item.enclosure;
  if (enc?.url?.startsWith("http") && (enc.type?.startsWith("image") ?? true)) {
    return enc.url;
  }
  const thumb = item.mediaThumbnail?.$?.url;
  if (thumb?.startsWith("http")) return thumb;
  const media = item.mediaContent?.find(
    (m) =>
      m.$?.url?.startsWith("http") &&
      (m.$?.medium === "image" || (m.$?.type?.startsWith("image") ?? false)),
  );
  if (media?.$?.url) return media.$.url;
  const body = item["content:encoded"] ?? item.content ?? "";
  return firstImageSrc(body) ?? firstImageUrlInText(item.contentSnippet ?? body);
}

export async function runRSSPollJob(): Promise<void> {
  const feeds = await feedRepo.findActive();
  const now = new Date();

  for (const feed of feeds) {
    if (!isDueForPolling(feed, now)) continue;

    console.log(`[rss] polling ${feed.url}`);
    try {
      const channel = await parser.parseURL(feed.url);
      const items = channel.items ?? [];

      let ingested = 0;
      for (const item of items) {
        const url = item.link ?? item.guid;
        if (!url) continue;
        const leadImageUrl = imageFromRssItem(item as RssItemLike);
        const result = await ingestUrl(url, {
          feedId: FeedId(feed.id),
          ...(item.title ? { overrideTitle: item.title } : {}),
          ...(leadImageUrl ? { leadImageUrl } : {}),
        });
        if (!result.skipped) ingested++;
      }

      console.log(`[rss] ${feed.url}: ${ingested} new articles`);
      await feedRepo.update(FeedId(feed.id), { lastPolledAt: now });
    } catch (err) {
      console.error(`[rss] failed to poll ${feed.url}:`, err);
    }
  }
}
