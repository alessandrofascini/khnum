import { EventDecorator } from "./event-decorator";
import type { DtoEventInstance, NamedEventCtor } from "./types";

/** Builds an `Event` subclass carrying a single payload value. */
export function DtoEvent<TValue = unknown>(
  eventName: string,
  defaultInit: EventInit = {},
): NamedEventCtor<DtoEventInstance<TValue>, [value: TValue, init?: EventInit]> {
  const Base = EventDecorator(eventName, defaultInit);

  class DtoEvent extends Base implements DtoEventInstance<TValue> {
    readonly value: TValue;

    constructor(value: TValue, init: EventInit = defaultInit) {
      super(init);
      this.value = value;
    }
  }

  return DtoEvent;
}
