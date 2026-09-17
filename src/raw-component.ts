import { KhnumError } from "./errors";

type Cleanup = () => void;

export class RawComponent extends HTMLElement {
  #cleanups: Cleanup[] = [];

  render(): void {
    throw new KhnumError("RawComponent.render", "is not implemented");
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {}

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    for (const cleanup of this.#cleanups) cleanup();
    this.#cleanups.length = 0;
  }

  beforeDisconnect(cleanup: Cleanup): void {
    this.#cleanups.push(cleanup);
  }

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
    target?: EventTarget,
  ): void {
    if (target) {
      target.addEventListener(type, listener, options);
    } else {
      super.addEventListener(type, listener, options);
    }
    this.beforeDisconnect(() => this.removeEventListener(type, listener, options, target));
  }

  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
    target?: EventTarget,
  ): void {
    if (target) {
      target.removeEventListener(type, listener, options);
    } else {
      super.removeEventListener(type, listener, options);
    }
  }
}
