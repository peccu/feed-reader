import { describe, expect, test } from "bun:test";
import { canTransitionTo } from "../../src/reader/QueueStatus.ts";

describe("canTransitionTo", () => {
  test("unread → reading: allowed", () => {
    expect(canTransitionTo("unread", "reading")).toBe(true);
  });

  test("unread → skipped: allowed", () => {
    expect(canTransitionTo("unread", "skipped")).toBe(true);
  });

  test("unread → read: allowed (card is the reader)", () => {
    expect(canTransitionTo("unread", "read")).toBe(true);
  });

  test("read → reading: not allowed", () => {
    expect(canTransitionTo("read", "reading")).toBe(false);
  });

  test("reading → read: allowed", () => {
    expect(canTransitionTo("reading", "read")).toBe(true);
  });

  test("reading → skipped: allowed", () => {
    expect(canTransitionTo("reading", "skipped")).toBe(true);
  });

  test("reading → unread: not allowed", () => {
    expect(canTransitionTo("reading", "unread")).toBe(false);
  });

  test("skipped → unread: allowed (undo)", () => {
    expect(canTransitionTo("skipped", "unread")).toBe(true);
  });

  test("skipped → archived: allowed", () => {
    expect(canTransitionTo("skipped", "archived")).toBe(true);
  });

  test("archived → any: not allowed", () => {
    expect(canTransitionTo("archived", "unread")).toBe(false);
    expect(canTransitionTo("archived", "read")).toBe(false);
    expect(canTransitionTo("archived", "skipped")).toBe(false);
  });
});
