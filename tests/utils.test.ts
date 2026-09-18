import fc from "fast-check";
import {describe, expect, it} from "vitest";
import {makeComponentId, toRenderMethodName} from "../src/utils";

// Fuzz-first, per antirez's testing philosophy (https://oldblog.antirez.com/post/redis-new-test-engine.html):
// most bugs in these pure transforms will show up as broken invariants under random input,
// not as a handful of hand-picked examples. Examples below are kept minimal, as anchors/documentation,
// not as the primary source of confidence.

describe("toRenderMethodName", () => {
  it("always starts with 'render' and has length propName.length + 6", () => {
    fc.assert(
      fc.property(fc.string(), (propName) => {
        const result = toRenderMethodName(propName);
        expect(result.startsWith("render")).toBe(true);
        expect(result.length).toBe(propName.length + 6);
      }),
      {numRuns: 500},
    );
  });

  it("uppercases only the first character of propName, leaving the rest untouched", () => {
    fc.assert(
      fc.property(fc.string({minLength: 1}), (propName) => {
        const result = toRenderMethodName(propName);
        expect(result.slice(6)).toBe(propName.charAt(0).toUpperCase() + propName.slice(1));
      }),
      {numRuns: 500},
    );
  });

  it("degrades gracefully for an empty propName", () => {
    expect(toRenderMethodName("")).toBe("render");
  });
});

describe("makeComponentId", () => {
  it("always returns 24 lowercase hex characters", () => {
    for (let i = 0; i < 500; i++) {
      expect(makeComponentId()).toMatch(/^[0-9a-f]{24}$/);
    }
  });

  it("never produces the same id twice within a session", () => {
    const ids = Array.from({length: 500}, () => makeComponentId());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is monotonically increasing (timestamp + counter never go backwards)", () => {
    const ids = Array.from({length: 500}, () => makeComponentId());
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });
});
