import fc from "fast-check";
import {describe, expect, it} from "vitest";
import {EventDecorator} from "../../src/events/event-decorator";

describe("EventDecorator", () => {
  it("eventName static getter always returns the name it was built with", () => {
    fc.assert(
      fc.property(fc.string({minLength: 1}), (eventName) => {
        const NamedEvent = EventDecorator(eventName);
        expect(NamedEvent.eventName).toBe(eventName);
      }),
      {numRuns: 200},
    );
  });

  it("constructs a real Event with .type set to the fixed event name", () => {
    const Foo = EventDecorator("foo");
    const event = new Foo();
    expect(event).toBeInstanceOf(Event);
    expect(event.type).toBe("foo");
  });

  it("uses defaultInit when constructed with no arguments", () => {
    const Foo = EventDecorator("foo", {bubbles: true, cancelable: true, composed: true});
    const event = new Foo();
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.composed).toBe(true);
  });

  it("an explicit init fully replaces defaultInit rather than merging with it", () => {
    const Foo = EventDecorator("foo", {bubbles: true, cancelable: true});
    const event = new Foo({bubbles: false});
    expect(event.bubbles).toBe(false);
    // cancelable wasn't in the explicit init, so it falls back to Event's own default (false),
    // not defaultInit's cancelable: true -- constructor params replace, they don't merge.
    expect(event.cancelable).toBe(false);
  });

  it("two calls with the same event name produce distinct, unrelated classes", () => {
    const A = EventDecorator("same-name");
    const B = EventDecorator("same-name");
    expect(A).not.toBe(B);
    expect(new A()).not.toBeInstanceOf(B);
  });
});
