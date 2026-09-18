import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { KhnumError } from "../../src/errors";
import { AttributeName } from "../../src/internal/attribute-name";

// Fuzz-first, per antirez's testing philosophy (https://oldblog.antirez.com/post/redis-new-test-engine.html):
// most bugs here will show up as broken invariants under random input, not as a handful of
// hand-picked examples. Examples below are kept minimal, as anchors/documentation.

// Element.setAttribute's actual validation rule (see MDN): non-empty, no ASCII whitespace,
// NUL, "/", ">", or "=" anywhere.
const validAttributeName = fc.string({ minLength: 1 }).filter((s) => !/[\0\s/>=]/.test(s));
const validAttributeNameWithAlnum = validAttributeName.filter((s) => /[a-zA-Z0-9]/.test(s));

describe("AttributeName validation", () => {
  it("accepts any non-empty string without whitespace, NUL, '/', '>', or '='", () => {
    fc.assert(
      fc.property(validAttributeName, (raw) => {
        expect(() => new AttributeName(raw)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it("rejects an empty string", () => {
    expect(() => new AttributeName("")).toThrow(KhnumError);
  });

  it.each([" a", "a a", "a\ta", "a/a", "a>a", "a=a", "a\0a"])("rejects %j", (raw) => {
    expect(() => new AttributeName(raw)).toThrow(KhnumError);
  });

  // isWhitespace's ECMAScript `\s` code points are checked one by one rather than via
  // regex; fast-check's fuzzing rarely lands on these rare unicode code points, so they're
  // pinned explicitly to actually exercise each comparison.
  it.each([
    "a\na", // \n
    "a\va", // \v
    "a\fa", // \f
    "a\ra", // \r
    "a a", // no-break space
    "a a", // ogham space mark
    "a a", // en quad (covers the 0x2000-0x200a range check)
    "a a", // line separator
    "a a", // paragraph separator
    "a a", // narrow no-break space
    "a a", // medium mathematical space
    "a　a", // ideographic space
    "a﻿a", // zero width no-break space / BOM
  ])("rejects %j (unicode whitespace/line terminator)", (raw) => {
    expect(() => new AttributeName(raw)).toThrow(KhnumError);
  });
});

describe("AttributeName.propName / .attributeName", () => {
  it("never throws deriving propName/attributeName for any valid attribute name", () => {
    fc.assert(
      fc.property(validAttributeName, (raw) => {
        const attr = new AttributeName(raw);
        expect(typeof attr.propName).toBe("string");
        expect(typeof attr.attributeName).toBe("string");
      }),
      { numRuns: 500 },
    );
  });

  it("propName never contains a hyphen or whitespace", () => {
    fc.assert(
      fc.property(validAttributeName, (raw) => {
        expect(new AttributeName(raw).propName).not.toMatch(/[-\s]/);
      }),
      { numRuns: 500 },
    );
  });

  it("propName starts with a non-uppercase character when it contains any alphanumeric", () => {
    fc.assert(
      fc.property(validAttributeNameWithAlnum, (raw) => {
        const { propName } = new AttributeName(raw);
        expect(propName[0]).toBe(propName[0].toLowerCase());
      }),
      { numRuns: 500 },
    );
  });

  it("attributeName never contains an uppercase ASCII letter or whitespace", () => {
    fc.assert(
      fc.property(validAttributeName, (raw) => {
        expect(new AttributeName(raw).attributeName).not.toMatch(/[A-Z\s]/);
      }),
      { numRuns: 500 },
    );
  });

  it("treats underscore as a plain word character in both propName and attributeName", () => {
    // propName and attributeName are now built from the same per-character "new segment"
    // decision, so underscore is consistent between them: neither treats it as a
    // separator, both just pass it through literally.
    expect(new AttributeName("foo_bar").propName).toBe("foo_bar");
    expect(new AttributeName("foo_bar").attributeName).toBe("foo_bar");
  });

  it("preserves a leading underscore, unlike a leading hyphen", () => {
    // The leading-separator skip uses isWordChar, not isAlnum, so it's consistent with
    // underscore's treatment everywhere else: never a separator to strip. A leading
    // hyphen is a real separator and still gets stripped.
    expect(new AttributeName("_foo").propName).toBe("_foo");
    expect(new AttributeName("-foo").propName).toBe("foo");
  });

  // Restricted to inputs with at least one alphanumeric character: an attribute name made
  // entirely of separators (e.g. "---") is syntactically valid but has no meaningful
  // propName (it strips to ""), and "" is itself not a valid AttributeName -- there's no
  // sensible JS property for an attribute with no real characters in it.
  it("is fully idempotent: constructing from its own propName reproduces it", () => {
    fc.assert(
      fc.property(validAttributeNameWithAlnum, (raw) => {
        const once = new AttributeName(raw);
        const twice = new AttributeName(once.propName);
        expect(twice.propName).toBe(once.propName);
        expect(twice.attributeName).toBe(once.attributeName);
      }),
      { numRuns: 500 },
    );
  });

  // Pinned examples: documents the exact expected mapping, does not replace the fuzzing above.
  it("converts kebab-case and camelCase input to the same propName/attributeName", () => {
    expect(new AttributeName("is-active").propName).toBe("isActive");
    expect(new AttributeName("isActive").attributeName).toBe("is-active");
  });

  it("normalizes a leading separator instead of miscapitalizing the first real character", () => {
    // This is the exact bug fast-check found in the old free-function version: a leading
    // separator made the first real character match as a word-boundary (uppercased)
    // instead of the start of the string (lowercased), e.g. toCamelCase(" active") used
    // to produce "Active". Fixed by stripping leading non-alphanumerics before converting,
    // which is what makes the idempotency property above hold unconditionally now.
    expect(new AttributeName("-active").propName).toBe("active");
  });

  it("only lowercases the first letter of a leading acronym, not the whole run (documented current behavior)", () => {
    // attributeName is derived from propName, not from raw input directly (matching how
    // shape.ts always composes these: camelCase first, then kebab). toPropName("XMLParser")
    // only lowercases the very first character -> "xMLParser"; toAttrName then finds a
    // single lower-to-upper transition (x -> M) and splits there, leaving the rest of the
    // acronym fused to what follows instead of hyphenating each capital individually.
    expect(new AttributeName("XMLParser").propName).toBe("xMLParser");
    expect(new AttributeName("XMLParser").attributeName).toBe("x-mlparser");
  });
});
