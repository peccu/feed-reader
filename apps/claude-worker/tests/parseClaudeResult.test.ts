import { describe, expect, test } from "bun:test";
import { parseClaudeResult } from "../src/index.ts";

describe("parseClaudeResult", () => {
  test("extracts result text and session_id from CLI JSON output", () => {
    const stdout = JSON.stringify({
      type: "result",
      subtype: "success",
      result: "Here is the summary.",
      session_id: "abc-123",
      total_cost_usd: 0.01,
    });
    expect(parseClaudeResult(stdout)).toEqual({
      text: "Here is the summary.",
      sessionId: "abc-123",
    });
  });

  test("falls back to plain text when output is not JSON", () => {
    expect(parseClaudeResult("just a plain answer\n")).toEqual({
      text: "just a plain answer",
      sessionId: null,
    });
  });

  test("tolerates JSON without a session id", () => {
    const stdout = JSON.stringify({ result: "no session here" });
    expect(parseClaudeResult(stdout)).toEqual({
      text: "no session here",
      sessionId: null,
    });
  });

  test("accepts camelCase sessionId and text fields", () => {
    const stdout = JSON.stringify({ text: "hi", sessionId: "s-9" });
    expect(parseClaudeResult(stdout)).toEqual({ text: "hi", sessionId: "s-9" });
  });
});
