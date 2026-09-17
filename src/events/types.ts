export interface NamedEventCtor<TInstance extends Event, TArgs extends unknown[]> {
  new (...args: TArgs): TInstance;
  readonly eventName: string;
}

export interface ChangedEventInstance<TValue> extends Event {
  readonly newVal: TValue;
  readonly oldVal: TValue;
}

export interface DtoEventInstance<TValue> extends Event {
  readonly value: TValue;
}
