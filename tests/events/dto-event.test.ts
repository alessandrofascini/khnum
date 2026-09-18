import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DtoEvent } from "../../src/events/dto-event";

describe("DtoEvent", () => {
  it("carries the given value and inherits the fixed event name", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.anything(), (eventName, value) => {
        const Dto = DtoEvent(eventName);
        const event = new Dto(value);
        expect(event.type).toBe(eventName);
        expect(Dto.eventName).toBe(eventName);
        expect(event.value).toBe(value);
      }),
      { numRuns: 200 },
    );
  });

  it("is a real Event", () => {
    const Dto = DtoEvent<string>("payload");
    const event = new Dto("hello");
    expect(event).toBeInstanceOf(Event);
    expect(event).toBeInstanceOf(Dto);
  });

  it("applies defaultInit when init is omitted", () => {
    const Dto = DtoEvent<string>("payload", { bubbles: true });
    const event = new Dto("hello");
    expect(event.bubbles).toBe(true);
  });

  it("an explicit init overrides defaultInit", () => {
    const Dto = DtoEvent<string>("payload", { bubbles: true });
    const event = new Dto("hello", { bubbles: false });
    expect(event.bubbles).toBe(false);
  });
});
