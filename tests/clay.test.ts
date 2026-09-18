import { describe, expect, it, vi } from "vitest";
import { Clay } from "../src/clay";
import { KhnumError } from "../src/errors";

class BareClay extends Clay {}
customElements.define("bare-clay", BareClay);

class RenderableClay extends Clay {
  renderCount = 0;
  override render(): void {
    this.renderCount++;
  }
}
customElements.define("renderable-clay", RenderableClay);

describe("Clay", () => {
  it("render() throws by default", () => {
    const el = new BareClay();
    expect(() => el.render()).toThrow(KhnumError);
  });

  it("connectedCallback calls render()", () => {
    const el = new RenderableClay();
    expect(el.renderCount).toBe(0);
    document.body.append(el);
    expect(el.renderCount).toBe(1);
    el.remove();
  });

  it("attributeChangedCallback is a no-op by default", () => {
    const el = new BareClay();
    expect(() => el.attributeChangedCallback("x", null, "y")).not.toThrow();
  });

  it("disconnectedCallback does not throw when no cleanups were ever registered", () => {
    const el = new RenderableClay();
    document.body.append(el);
    expect(() => el.remove()).not.toThrow();
  });

  it("beforeDisconnect runs registered cleanups, in order, on disconnect", () => {
    const el = new RenderableClay();
    document.body.append(el);
    const calls: number[] = [];
    el.beforeDisconnect(() => calls.push(1));
    el.beforeDisconnect(() => calls.push(2));
    el.remove();
    expect(calls).toEqual([1, 2]);
  });

  it("cleanups only run once: reconnecting and disconnecting again does not re-run them", () => {
    const el = new RenderableClay();
    document.body.append(el);
    const cleanup = vi.fn();
    el.beforeDisconnect(cleanup);
    el.remove();
    expect(cleanup).toHaveBeenCalledTimes(1);

    document.body.append(el);
    el.remove();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("addEventListener without a target attaches to the element itself and auto-removes on disconnect", () => {
    const el = new RenderableClay();
    document.body.append(el);
    const handler = vi.fn();
    el.addEventListener("click", handler);
    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
    el.dispatchEvent(new Event("click"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("addEventListener with an external target attaches there instead, and auto-removes on disconnect", () => {
    const el = new RenderableClay();
    const external = new EventTarget();
    document.body.append(el);
    const handler = vi.fn();
    el.addEventListener("ping", handler, undefined, external);
    external.dispatchEvent(new Event("ping"));
    expect(handler).toHaveBeenCalledTimes(1);

    el.remove();
    external.dispatchEvent(new Event("ping"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("removeEventListener manually detaches without waiting for disconnect", () => {
    const el = new RenderableClay();
    document.body.append(el);
    const handler = vi.fn();
    el.addEventListener("click", handler);
    el.removeEventListener("click", handler);
    el.dispatchEvent(new Event("click"));
    expect(handler).not.toHaveBeenCalled();

    // The auto-added cleanup will try to remove this (already-removed) listener again on
    // disconnect -- that must stay a harmless no-op, not throw.
    expect(() => el.remove()).not.toThrow();
  });

  it("removeEventListener with an external target detaches from that target", () => {
    const el = new RenderableClay();
    const external = new EventTarget();
    const handler = vi.fn();
    el.addEventListener("ping", handler, undefined, external);
    el.removeEventListener("ping", handler, undefined, external);
    external.dispatchEvent(new Event("ping"));
    expect(handler).not.toHaveBeenCalled();
  });
});
