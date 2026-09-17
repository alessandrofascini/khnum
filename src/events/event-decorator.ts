import type { NamedEventCtor } from "./types";

/** Builds an `Event` subclass bound to a fixed event name. */
export function EventDecorator(eventName: string, defaultInit: EventInit = {}): NamedEventCtor<Event, [init?: EventInit]> {
  class NamedEvent extends Event {
    static get eventName(): string {
      return eventName;
    }

    constructor(init: EventInit = defaultInit) {
      super(eventName, init);
    }
  }

  return NamedEvent;
}
