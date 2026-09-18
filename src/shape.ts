import {Clay} from "./clay";
import {AttributeName} from "./internal/attribute-name";
import {makeComponentId, toRenderMethodName} from "./utils";

/** Something that must be fired (registered with `customElements`) before it can be used. */
export interface Fireable {
  fire(): void;
}

/** Maps camelCase property names to their (string | null) attribute-backed value. */
export type AttributeMap = Record<string, string | null>;

export type Vessel<TProps extends object = object> = Fireable & {
  new (): Clay & {readonly componentId: string} & {[K in keyof TProps]: TProps[K]};
  readonly tagName: string;
  readonly observedAttributes: string[];
  readonly attributeNames: string[];
};

/**
 * Shapes `Clay` into a `Vessel`: a custom element class with attribute-backed
 * reactive properties. Setting a property (or its attribute) calls
 * `render<PropName>()` when connected, instead of forcing a full `render()`.
 * Pass `TProps` (a type with no index signature, e.g. `{ label: string | null }`)
 * to type the resulting properties.
 */
export function Shape<TProps extends object = object>(
  tagName: string,
  attributeNames: readonly string[] = [],
  dependencies: readonly Fireable[] = [],
): Vessel<TProps> {
  const propNames = new Array(attributeNames.length);
  const htmlNames = new Array(attributeNames.length);
  const propNameByAttrName = new Map<string, string>();

  attributeNames.forEach((raw, index) => {
    const attr = new AttributeName(raw);
    propNames[index] = attr.propName;
    htmlNames[index] = attr.attributeName;
    propNameByAttrName.set(attr.attributeName, attr.propName);
  });

  class Base extends Clay {
    #componentId: string | undefined;

    get componentId(): string {
      return (this.#componentId ??= `${tagName}@${makeComponentId()}`);
    }

    override attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null,
    ): void {
      const propName = propNameByAttrName.get(name);
      if (propName) {
        (this as unknown as Record<string, unknown>)[propName] = newValue;
      }
    }

    static get tagName(): string {
      return tagName;
    }

    static get observedAttributes(): string[] {
      return htmlNames;
    }

    static get attributeNames(): string[] {
      return htmlNames;
    }

    static fire(): void {
      if (customElements.get(tagName)) return;
      for (const dep of dependencies) dep.fire();
      customElements.define(tagName, this);
    }
  }

  propNames.forEach((propName, index) => {
    const attrName = htmlNames[index];
    const renderMethod = toRenderMethodName(propName);
    const backingField = `_${propName}`;

    const descriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: true,
      get(this: Clay): string | null {
        return (this as unknown as Record<string, string | null>)[backingField] ?? null;
      },
      set(this: Clay, value: string | null) {
        (this as unknown as Record<string, string | null>)[backingField] = value;
        if (this.isConnected) {
          (this as unknown as Record<string, (() => void) | undefined>)[renderMethod]?.();
        }
      },
    };

    Object.defineProperty(Base.prototype, propName, descriptor);
    if (attrName !== propName) {
      Object.defineProperty(Base.prototype, attrName, descriptor);
    }
  });

  return Base as unknown as Vessel<TProps>;
}
