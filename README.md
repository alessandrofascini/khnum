# khnum

A lightweight library for creating web components easily.

## Status

🚧 Early development. The API may still change; not yet published to npm.

## Install

```sh
npm install khnum
```

## Quick start

```ts
import {Shape, mold} from "khnum";

type Props = {label: string | null};

class HelloWorld extends Shape<Props>("hello-world", ["label"]) {
  render(): void {
    this.replaceChildren(mold("span", `Hello, ${this.label ?? "world"}!`));
  }
}

HelloWorld.fire(); // registers <hello-world> with customElements, once

document.body.append(mold(HelloWorld, {label: "Khnum"}));
```

## Core concepts

### `Clay`

The base custom element class every component ultimately extends. Plain `HTMLElement`, plus:

- `render()` — called from `connectedCallback()`. Throws by default; override it.
- `beforeDisconnect(cleanup)` — registers a `() => void` to run once, the next time the element disconnects (and only then — reconnecting afterwards does not re-run it).
- `addEventListener(type, listener, options?, target?)` — overridden to auto-register its own removal via `beforeDisconnect`, so listeners never leak. Pass `target` to attach the listener to some other `EventTarget` (e.g. `window`) while still cleaning it up when _this_ element disconnects.
- `removeEventListener(type, listener, options?, target?)` — same signature, for removing a listener manually ahead of disconnect.

### `Shape(tagName, attributeNames?, dependencies?)`

Shapes `Clay` into a `Vessel`: a custom element class with attribute-backed reactive properties.

```ts
type Props = {isActive: string | null; label: string | null};

class Widget extends Shape<Props>("my-widget", ["is-active", "label"]) {
  render(): void {
    /* initial render */
  }
  renderIsActive(): void {
    /* called on change, once connected */
  }
}
```

- Each name in `attributeNames` (kebab-case or camelCase, e.g. `"is-active"` or `"isActive"`) becomes a reactive `string | null` property. Setting the property, or its backing attribute, calls `render<PropName>()` (if defined) whenever the element is connected.
- `Widget.tagName` / `Widget.observedAttributes` / `Widget.attributeNames` are exposed as statics.
- `Widget.fire()` fires every dependency in `dependencies` (anything `Fireable`) and then calls `customElements.define(tagName, Widget)`. Safe to call more than once — later calls are no-ops.
- Each instance has a stable `componentId`, prefixed with `tagName`.
- An invalid attribute name throws `KhnumError` immediately, at `Shape()` call time.

### `mold(target, propsOrChild?, ...children)`

Hyperscript-style element factory.

```ts
mold("div", {id: "x", style: {color: "red"}}, "hello", childNode);
mold(MyCustomElement, {label: "hi"});
```

- `target` — a tag name, or a custom element constructor.
- `propsOrChild` — omitted entirely, a `Node`/`string` (appended as the first child), or a plain attributes object (`style` is applied via `CSSStyleDeclaration.setProperty`, `undefined` style values are skipped; everything else via `setAttribute`, stringified). Anything else throws `KhnumError`.
- `...children` — appended in order, `null`/`undefined` entries skipped.

### `Ennead`

Fluent builder that composes several `Vessel`s into one container custom element.

```ts
const Widget = new Ennead("my-container")
  .use(ChildA, ChildB) // merges their attributeNames, registers them as dependencies
  .attributeNames("extra-attr")
  .dependencies(someOtherFireable)
  .build();

Widget.fire();
```

- `.use(...components)` — adds each `Vessel<AttributeMap>` as a child to render, merging in its `attributeNames` and registering it as a dependency of the container.
- `.attributeNames(...names)` / `.dependencies(...deps)` — add more of each; both dedupe.
- `.build()` — snapshots the current configuration into a `Container` `Vessel` and returns it. Later calls on the same `Ennead` do not affect an already-built `Container`.

The built container's `render()` creates one fresh child instance per used component per render, forwarding each of the container's own matching properties down as an attribute (skipping `null` ones). Its `attributeChangedCallback` fans every attribute change out to each current child node.

Because `.use()` is typed to take `Vessel<AttributeMap>`, passing a normally-typed component needs a type-erasing cast — see `asAnyVessel` in [tests/ennead.test.ts](tests/ennead.test.ts) for the pattern.

### Events: `EventDecorator`, `ChangedEvent`, `DtoEvent`

Factories for dispatching structured custom events with a fixed name.

```ts
const ValueChanged = ChangedEvent<number>("value-changed");
el.dispatchEvent(new ValueChanged(newVal, oldVal, {bubbles: true}));

const ItemAdded = DtoEvent<Item>("item-added");
el.dispatchEvent(new ItemAdded(item));
```

- `EventDecorator(eventName, defaultInit?)` — a plain `Event` subclass fixed to `eventName`; exposes `.eventName` as a static and takes an optional `EventInit` (falling back to `defaultInit`).
- `ChangedEvent<TValue>(eventName, defaultInit?)` — adds `readonly newVal`/`oldVal: TValue`; constructor is `new Changed(newVal, oldVal, init?)`.
- `DtoEvent<TValue>(eventName, defaultInit?)` — adds `readonly value: TValue`; constructor is `new Dto(value, init?)`.

### `KhnumError`

The error type thrown for invalid input (e.g. a bad attribute name, an invalid `mold()` props argument). Carries the throwing function's name and formats as `Khnum.<functionName>: <message>` via `toString()`.

### Supporting types

- `Fireable` — `{ fire(): void }`, anything that must be registered with `customElements` before use (a `Vessel`, or an `Ennead`-built container).
- `Vessel<TProps>` — what `Shape()` returns: a `Fireable` custom element constructor with `tagName`/`observedAttributes`/`attributeNames` statics, plus `componentId` and one reactive property per key of `TProps` on each instance.
- `AttributeMap` — `Record<string, string | null>`, the widened prop shape `Ennead.use()` needs since it can't know each component's exact `TProps`.
- `MoldAttributes` / `MoldChild` / `MoldStyle` — the prop/child/style shapes `mold()` accepts.

## License

MIT
