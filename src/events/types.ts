export interface NamedEventCtor<E extends Event, A extends unknown[]> {
  new (...args: A): E;
  readonly eventName: string;
}

export interface ChangedEventInstance<T> extends Event {
  readonly newVal: T;
  readonly oldVal: T;
}

export interface DtoEventInstance<T> extends Event {
  readonly value: T;
}
