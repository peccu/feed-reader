import { describe, expect, it } from "bun:test";
import { createFeed, isDueForPolling } from "../../src/content/Feed.ts";
import { FeedId } from "../../src/shared.ts";

const baseInput = {
  id: FeedId("f1"),
  url: "https://example.com/feed.xml",
  title: "Test Feed",
};

describe("createFeed", () => {
  it("applies default pollingIntervalSeconds=3600 and isActive=true", () => {
    const feed = createFeed(baseInput);
    expect(feed.pollingIntervalSeconds).toBe(3600);
    expect(feed.isActive).toBe(true);
    expect(feed.lastPolledAt).toBeNull();
    expect(feed.description).toBeNull();
  });

  it("stores explicit pollingIntervalSeconds", () => {
    const feed = createFeed({ ...baseInput, pollingIntervalSeconds: 600 });
    expect(feed.pollingIntervalSeconds).toBe(600);
  });

  it("throws when pollingIntervalSeconds below minimum (300)", () => {
    expect(() => createFeed({ ...baseInput, pollingIntervalSeconds: 299 })).toThrow();
    expect(() => createFeed({ ...baseInput, pollingIntervalSeconds: 0 })).toThrow();
  });

  it("accepts minimum polling interval exactly", () => {
    const feed = createFeed({ ...baseInput, pollingIntervalSeconds: 300 });
    expect(feed.pollingIntervalSeconds).toBe(300);
  });
});

describe("isDueForPolling", () => {
  it("returns true when lastPolledAt is null", () => {
    const feed = createFeed(baseInput);
    expect(isDueForPolling(feed)).toBe(true);
  });

  it("returns false when polled recently (not enough time elapsed)", () => {
    const now = new Date();
    const recentPoll = new Date(now.getTime() - 1000); // 1 second ago
    const feed = { ...createFeed(baseInput), lastPolledAt: recentPoll };
    expect(isDueForPolling(feed, now)).toBe(false);
  });

  it("returns true when enough time has elapsed", () => {
    const now = new Date();
    // pollingInterval is 3600s; set lastPolledAt to 3601s ago
    const oldPoll = new Date(now.getTime() - 3601 * 1000);
    const feed = { ...createFeed(baseInput), lastPolledAt: oldPoll };
    expect(isDueForPolling(feed, now)).toBe(true);
  });

  it("returns false at exactly the boundary minus 1ms", () => {
    const now = new Date();
    const justUnder = new Date(now.getTime() - (3600 * 1000 - 1));
    const feed = { ...createFeed(baseInput), lastPolledAt: justUnder };
    expect(isDueForPolling(feed, now)).toBe(false);
  });
});
