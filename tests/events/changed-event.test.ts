import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ChangedEvent } from "../../src/events/changed-event";

describe("ChangedEvent", () => {
  it("carries the given newVal/oldVal and inherits the fixed event name", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.anything(),
        fc.anything(),
        (eventName, newVal, oldVal) => {
          const Changed = ChangedEvent(eventName);
          const event = new Changed(newVal, oldVal);
          expect(event.type).toBe(eventName);
          expect(Changed.eventName).toBe(eventName);
          expect(event.newVal).toBe(newVal);
          expect(event.oldVal).toBe(oldVal);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("is a real Event", () => {
    const Changed = ChangedEvent<number>("value-changed");
    const event = new Changed(2, 1);
    expect(event).toBeInstanceOf(Event);
    expect(event).toBeInstanceOf(Changed);
  });

  it("applies defaultInit when init is omitted", () => {
    const Changed = ChangedEvent<number>("value-changed", { bubbles: true });
    const event = new Changed(2, 1);
    expect(event.bubbles).toBe(true);
  });

  it("an explicit init overrides defaultInit", () => {
    const Changed = ChangedEvent<number>("value-changed", { bubbles: true });
    const event = new Changed(2, 1, { bubbles: false });
    expect(event.bubbles).toBe(false);
  });
});
