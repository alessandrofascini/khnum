import { describe, expect, it } from "vitest";
import { KhnumError } from "../src/errors";
import { mold } from "../src/mold";

class MoldTestElement extends HTMLElement {}
customElements.define("mold-test-element", MoldTestElement);

describe("mold", () => {
  it("creates an element from a tag name string", () => {
    const el = mold("div");
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.tagName).toBe("DIV");
  });

  it("creates an element from a registered custom element constructor", () => {
    const el = mold(MoldTestElement);
    expect(el).toBeInstanceOf(MoldTestElement);
  });

  it("appends a string first-arg as a text child instead of treating it as props", () => {
    const el = mold("div", "hello");
    expect(el.textContent).toBe("hello");
  });

  it("appends a Node first-arg as a child instead of treating it as props", () => {
    const child = document.createElement("span");
    const el = mold("div", child);
    expect(el.firstChild).toBe(child);
  });

  it("applies a props object's attributes via setAttribute", () => {
    const el = mold("div", { id: "x", "data-foo": "bar" });
    expect(el.getAttribute("id")).toBe("x");
    expect(el.getAttribute("data-foo")).toBe("bar");
  });

  it("stringifies non-string attribute values", () => {
    const el = mold("div", { "data-count": 42, "data-flag": true });
    expect(el.getAttribute("data-count")).toBe("42");
    expect(el.getAttribute("data-flag")).toBe("true");
  });

  it("applies each style entry from props.style, skipping undefined values", () => {
    const el = mold("div", { style: { color: "red", backgroundColor: undefined } });
    expect(el.style.color).toBe("red");
    expect(el.style.backgroundColor).toBe("");
  });

  it("appends rest-arg children in order, skipping null/undefined", () => {
    const a = document.createElement("span");
    const b = document.createElement("em");
    const el = mold("div", { id: "x" }, a, null, "text", undefined, b);
    const nodes = Array.from(el.childNodes).map((n) => (n instanceof Element ? n : n.textContent));
    expect(nodes).toEqual([a, "text", b]);
  });

  it("works with no propsOrChild and no children at all", () => {
    const el = mold("div");
    expect(el.attributes.length).toBe(0);
    expect(el.childNodes.length).toBe(0);
  });

  it("throws a KhnumError for an invalid propsOrChild type", () => {
    expect(() => mold("div", 42 as never)).toThrow(KhnumError);
    expect(() => mold("div", true as never)).toThrow(KhnumError);
  });
});
