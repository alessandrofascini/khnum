import { EventDecorator } from "./event-decorator";
import type { ChangedEventInstance, NamedEventCtor } from "./types";

/** Builds an `Event` subclass carrying the old/new value of a changed property or attribute. */
export function ChangedEvent<TValue = unknown>(
  eventName: string,
  defaultInit: EventInit = {},
): NamedEventCtor<ChangedEventInstance<TValue>, [newVal: TValue, oldVal: TValue, init?: EventInit]> {
  const Base = EventDecorator(eventName, defaultInit);

  class ChangedEvent extends Base implements ChangedEventInstance<TValue> {
    readonly newVal: TValue;
    readonly oldVal: TValue;

    constructor(newVal: TValue, oldVal: TValue, init: EventInit = defaultInit) {
      super(init);
      this.newVal = newVal;
      this.oldVal = oldVal;
    }
  }

  return ChangedEvent;
}
