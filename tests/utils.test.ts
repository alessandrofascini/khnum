import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { randomToken, toRenderMethodName } from "../src/utils";

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
      { numRuns: 500 },
    );
  });

  it("uppercases only the first character of propName, leaving the rest untouched", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (propName) => {
        const result = toRenderMethodName(propName);
        expect(result.slice(6)).toBe(propName.charAt(0).toUpperCase() + propName.slice(1));
      }),
      { numRuns: 500 },
    );
  });

  it("degrades gracefully for an empty propName", () => {
    expect(toRenderMethodName("")).toBe("render");
  });
});

describe("randomToken", () => {
  it("returns a string of exactly the requested length, for any non-negative length", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (length) => {
        expect(randomToken(length)).toHaveLength(length);
      }),
      { numRuns: 200 },
    );
  });

  it("only ever produces alphanumeric characters", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 200 }), (length) => {
        expect(randomToken(length)).toMatch(/^[0-9a-zA-Z]*$/);
      }),
      { numRuns: 200 },
    );
  });

  it("degrades to an empty string for a negative length", () => {
    expect(randomToken(-5)).toBe("");
  });

  it("does not produce the same token every time (statistical, not exhaustive)", () => {
    const tokens = Array.from({ length: 50 }, () => randomToken());
    expect(new Set(tokens).size).toBeGreaterThan(1);
  });
});
