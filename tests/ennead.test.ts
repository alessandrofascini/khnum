import {describe, expect, it, vi} from "vitest";
import {Ennead} from "../src/ennead";
import {Shape, type AttributeMap, type Vessel} from "../src/shape";

// A real component is authored with its own narrow Props type (methods like render() would
// conflict with AttributeMap's blanket `[x: string]: string | null` index signature). .use()
// is typed to take Vessel<AttributeMap> though, so passing a real component through it needs
// the same type-erasing cast ennead.ts itself uses on its own Container (`as unknown as
// AnyVessel`) -- there's no way around it while keeping a normally-typed component.
type ChildProps = {label: string | null};

function asAnyVessel(vessel: Vessel<ChildProps>): Vessel<AttributeMap> {
  return vessel as unknown as Vessel<AttributeMap>;
}

describe("Ennead", () => {
  it("dedupes attributeNames added via .attributeNames()", () => {
    const Widget = new Ennead("ennead-attrs").attributeNames("foo", "bar", "foo").build();
    expect([...Widget.attributeNames].sort()).toEqual(["bar", "foo"]);
  });

  it("dedupes dependencies added via .dependencies(), firing each only once", () => {
    const dep = {fire: vi.fn()};
    const Widget = new Ennead("ennead-deps").dependencies(dep, dep).build();
    Widget.fire();
    expect(dep.fire).toHaveBeenCalledTimes(1);
  });

  it("fire() is idempotent: a second call does not re-register or re-fire dependencies", () => {
    const dep = {fire: vi.fn()};
    const Widget = new Ennead("ennead-fire-once").dependencies(dep).build();
    Widget.fire();
    expect(customElements.get("ennead-fire-once")).toBe(Widget);
    expect(() => Widget.fire()).not.toThrow();
    expect(dep.fire).toHaveBeenCalledTimes(1);
  });

  it(".use() merges a component's own attributeNames and registers it as a dependency", () => {
    class Child extends Shape<ChildProps>("ennead-use-child", ["label"]) {
      render(): void {}
    }
    const Widget = new Ennead("ennead-use").use(asAnyVessel(Child)).build();
    expect(Widget.attributeNames).toEqual(["label"]);

    Widget.fire();
    expect(customElements.get("ennead-use-child")).toBe(Child);
  });

  it("renders one child instance per used component and applies matching attributes from its own props", () => {
    class Child extends Shape<ChildProps>("ennead-render-child", ["label"]) {
      render(): void {
        this.textContent = this.label ?? "";
      }
    }
    const Widget = new Ennead("ennead-render").use(asAnyVessel(Child)).build();
    Widget.fire();

    const el = new Widget();
    el.label = "hello";
    document.body.append(el);

    expect(el.children.length).toBe(1);
    const child = el.children[0] as InstanceType<typeof Child>;
    expect(child).toBeInstanceOf(Child);
    expect(child.getAttribute("label")).toBe("hello");
    expect(child.textContent).toBe("hello");

    el.remove();
  });

  it("does not set an attribute on the child when the container's matching prop is null", () => {
    class Child extends Shape<ChildProps>("ennead-null-child", ["label"]) {
      render(): void {}
    }
    const Widget = new Ennead("ennead-null").use(asAnyVessel(Child)).build();
    Widget.fire();

    const el = new Widget();
    document.body.append(el);

    expect(el.children[0]?.hasAttribute("label")).toBe(false);
    el.remove();
  });

  it("attributeChangedCallback fans an attribute change out to every current child node", () => {
    const calls: Array<[string, string | null, string | null]> = [];
    class Child extends Shape<ChildProps>("ennead-fanout-child", ["label"]) {
      render(): void {}
      override attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null,
      ): void {
        calls.push([name, oldValue, newValue]);
        super.attributeChangedCallback(name, oldValue, newValue);
      }
    }
    const Widget = new Ennead("ennead-fanout").use(asAnyVessel(Child)).build();
    Widget.fire();

    const el = new Widget();
    document.body.append(el);
    calls.length = 0; // ignore anything triggered by the initial render/upgrade

    el.attributeChangedCallback("label", null, "hi");
    expect(calls).toEqual([["label", null, "hi"]]);

    el.remove();
  });

  it("build() snapshots the current configuration -- later .use() calls do not affect an already-built Container", () => {
    class Child extends Shape<ChildProps>("ennead-snapshot-child", ["label"]) {
      render(): void {}
    }
    const builder = new Ennead("ennead-snapshot");
    const Widget = builder.build();
    builder.use(asAnyVessel(Child));
    expect(Widget.attributeNames).toEqual([]);
  });
});
