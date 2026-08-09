import { FeedId, isDueForPolling } from "@feed-reader/domain";
import RSSParser from "rss-parser";
import { feedRepo } from "../db.ts";
import { ingestUrl } from "../pipeline/ingestUrl.ts";

const parser = new RSSParser();

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
        const result = await ingestUrl(url, {
          feedId: FeedId(feed.id),
          ...(item.title ? { overrideTitle: item.title } : {}),
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
