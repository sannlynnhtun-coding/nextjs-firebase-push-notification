import { test } from "node:test";
import assert from "node:assert/strict";
import { safeMessageUrl } from "../utils/notification-url.mjs";
test("notification links allow web URLs and reject executable protocols", () => {
  for (const value of [
    "/settings",
    "https://example.com/message",
    "http://localhost:3001",
  ])
    assert.equal(safeMessageUrl(value), value);
  for (const value of [
    undefined,
    {},
    "",
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "https://[",
  ])
    assert.equal(safeMessageUrl(value), null);
});
