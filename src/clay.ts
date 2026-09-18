import {KhnumError} from "./errors";

type Cleanup = () => void;

/** The raw, unformed base: a plain custom element with lifecycle hooks and leak-safe listeners. */
export class Clay extends HTMLElement {
  #cleanups: Cleanup[] | undefined;

  render(): void {
    throw new KhnumError("Clay.render", "is not implemented");
  }

  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void {}

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    if (!this.#cleanups) return;
    for (const cleanup of this.#cleanups) {
      cleanup();
    }
    this.#cleanups.length = 0;
  }

  beforeDisconnect(cleanup: Cleanup): void {
    (this.#cleanups ??= []).push(cleanup);
  }

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
    target?: EventTarget,
  ): void {
    if (target) {
      target.addEventListener(type, listener, options);
      this.beforeDisconnect(() => target.removeEventListener(type, listener, options));
    } else {
      super.addEventListener(type, listener, options);
      this.beforeDisconnect(() => super.removeEventListener(type, listener, options));
    }
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
