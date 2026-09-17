export interface NamedEventCtor<TInstance extends Event, TArgs extends unknown[]> {
  new (...args: TArgs): TInstance;
  readonly EventName: string;
}

/** Builds an `Event` subclass bound to a fixed event name. */
export function EventDecorator(eventName: string, defaultInit: EventInit = {}): NamedEventCtor<Event, [init?: EventInit]> {
  class NamedEvent extends Event {
    static get EventName(): string {
      return eventName;
    }

    constructor(init: EventInit = defaultInit) {
      super(eventName, init);
    }
  }

  return NamedEvent;
}

export interface ChangedEventInstance<TValue> extends Event {
  readonly newVal: TValue;
  readonly oldVal: TValue;
}

/** Builds an `Event` subclass carrying the old/new value of a changed property or attribute. */
export function ChangedEvent<TValue = unknown>(
  eventName: string,
  defaultInit: EventInit = {},
): NamedEventCtor<ChangedEventInstance<TValue>, [newVal: TValue, oldVal: TValue, init?: EventInit]> {
  const Base = EventDecorator(eventName, defaultInit);

  class Changed extends Base implements ChangedEventInstance<TValue> {
    readonly newVal: TValue;
    readonly oldVal: TValue;

    constructor(newVal: TValue, oldVal: TValue, init: EventInit = defaultInit) {
      super(init);
      this.newVal = newVal;
      this.oldVal = oldVal;
    }
  }

  return Changed;
}

export interface DtoEventInstance<TValue> extends Event {
  readonly value: TValue;
}

/** Builds an `Event` subclass carrying a single payload value. */
export function DtoEvent<TValue = unknown>(
  eventName: string,
  defaultInit: EventInit = {},
): NamedEventCtor<DtoEventInstance<TValue>, [value: TValue, init?: EventInit]> {
  const Base = EventDecorator(eventName, defaultInit);

  class Dto extends Base implements DtoEventInstance<TValue> {
    readonly value: TValue;

    constructor(value: TValue, init: EventInit = defaultInit) {
      super(init);
      this.value = value;
    }
  }

  return Dto;
}
