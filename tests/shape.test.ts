import {describe, expect, it, vi} from "vitest";
import {KhnumError} from "../src/errors";
import {Shape} from "../src/shape";

describe("Shape - statics", () => {
  it("defaults to empty attributeNames/dependencies and exposes tagName/observedAttributes/attributeNames", () => {
    const Widget = Shape("shape-empty");
    expect(Widget.tagName).toBe("shape-empty");
    expect(Widget.observedAttributes).toEqual([]);
    expect(Widget.attributeNames).toEqual([]);
  });

  it("derives kebab-case attributeNames and exposes them via observedAttributes/attributeNames", () => {
    const Widget = Shape("shape-attrs", ["is-active", "label"]);
    expect(Widget.observedAttributes).toEqual(["is-active", "label"]);
    expect(Widget.attributeNames).toEqual(["is-active", "label"]);
  });

  it("propagates AttributeName validation errors at Shape() call time", () => {
    expect(() => Shape("shape-invalid", ["bad name"])).toThrow(KhnumError);
  });
});

describe("Shape - fire()", () => {
  it("registers the tag with customElements, and is idempotent", () => {
    class Widget extends Shape("shape-fire-once") {
      render(): void {}
    }
    expect(customElements.get("shape-fire-once")).toBeUndefined();
    Widget.fire();
    expect(customElements.get("shape-fire-once")).toBe(Widget);
    expect(() => Widget.fire()).not.toThrow();
    expect(customElements.get("shape-fire-once")).toBe(Widget);
  });

  it("fires dependencies before registering, but only on the first (unregistered) call", () => {
    const dep = {fire: vi.fn()};
    class Widget extends Shape("shape-fire-deps", [], [dep]) {
      render(): void {}
    }
    Widget.fire();
    expect(dep.fire).toHaveBeenCalledTimes(1);
    Widget.fire();
    expect(dep.fire).toHaveBeenCalledTimes(1);
  });
});

describe("Shape - componentId", () => {
  it("is prefixed with the tag name and stable across repeated reads", () => {
    class Widget extends Shape("shape-id") {
      render(): void {}
    }
    Widget.fire();
    const el = new Widget();
    expect(el.componentId.startsWith("shape-id@")).toBe(true);
    expect(el.componentId).toBe(el.componentId);
  });

  it("differs between instances", () => {
    class Widget extends Shape("shape-id-2") {
      render(): void {}
    }
    Widget.fire();
    const a = new Widget();
    const b = new Widget();
    expect(a.componentId).not.toBe(b.componentId);
  });
});

describe("Shape - reactive properties", () => {
  type Props = {isActive: string | null; label: string | null};

  class Widget extends Shape<Props>("shape-props", ["is-active", "label"]) {
    renderCalls: string[] = [];
    render(): void {}
    renderIsActive(): void {
      this.renderCalls.push("isActive");
    }
    // renderLabel() intentionally not defined, to exercise the optional-chaining path.
  }
  Widget.fire();

  it("getter defaults to null when unset", () => {
    const el = new Widget();
    expect(el.isActive).toBeNull();
    expect(el.label).toBeNull();
  });

  it("setter updates the value, readable back through the getter", () => {
    const el = new Widget();
    el.isActive = "yes";
    expect(el.isActive).toBe("yes");
  });

  it("does not call render<Prop>() while disconnected", () => {
    const el = new Widget();
    el.isActive = "yes";
    expect(el.renderCalls).toEqual([]);
  });

  it("calls render<Prop>() when connected and the method exists", () => {
    const el = new Widget();
    document.body.append(el);
    el.renderCalls = [];
    el.isActive = "yes";
    expect(el.renderCalls).toEqual(["isActive"]);
    el.remove();
  });

  it("does not throw when connected and render<Prop>() is not defined", () => {
    const el = new Widget();
    document.body.append(el);
    expect(() => {
      el.label = "hi";
    }).not.toThrow();
    el.remove();
  });

  it("exposes a second accessor under the literal kebab-case attribute name, backed by the same storage", () => {
    const el = new Widget();
    (el as unknown as Record<string, string | null>)["is-active"] = "via-attr-name";
    expect(el.isActive).toBe("via-attr-name");
  });

  it("does not need a second accessor when attrName === propName", () => {
    // "label" has no hyphen, so propName === attributeName -- just a normal single accessor,
    // defined once on the intermediate Base class Shape() returns (which Widget extends).
    const base = Object.getPrototypeOf(Widget.prototype) as object;
    expect(Object.getOwnPropertyDescriptor(base, "label")).toBeDefined();
    const el = new Widget();
    expect(el.label).toBeNull();
  });
});

describe("Shape - attributeChangedCallback", () => {
  type Props = {isActive: string | null};

  class Widget extends Shape<Props>("shape-attr-changed", ["is-active"]) {
    render(): void {}
  }
  Widget.fire();

  it("routes a recognized attribute name to the matching property", () => {
    const el = new Widget();
    el.attributeChangedCallback("is-active", null, "yes");
    expect(el.isActive).toBe("yes");
  });

  it("ignores an unrecognized attribute name", () => {
    const el = new Widget();
    expect(() => el.attributeChangedCallback("unknown-attr", null, "x")).not.toThrow();
    expect(el.isActive).toBeNull();
  });

  it("real attribute mutations on a connected element flow through to the property and trigger a render", () => {
    class Tracked extends Shape<Props>("shape-attr-live", ["is-active"]) {
      renderCalls = 0;
      render(): void {}
      renderIsActive(): void {
        this.renderCalls++;
      }
    }
    Tracked.fire();
    const el = new Tracked();
    document.body.append(el);
    el.renderCalls = 0;
    el.setAttribute("is-active", "yes");
    expect(el.isActive).toBe("yes");
    expect(el.renderCalls).toBe(1);
    el.remove();
  });
});
