import { RawComponent } from "./raw-component";
import { randomToken, toCamelCase, toKebabCase, toRenderMethodName } from "./utils";

export interface ComponentDependency {
  define(): void;
}

/** Maps camelCase property names to their (string | null) attribute-backed value. */
export type AttributeMap = Record<string, string | null>;

export type ComponentClass<TProps extends object = object> = ComponentDependency & {
  new (): RawComponent & { readonly componentId: string } & { [K in keyof TProps]: TProps[K] };
  readonly tagName: string;
  readonly observedAttributes: string[];
  readonly attributeNames: string[];
};

/**
 * Builds a `RawComponent` subclass with attribute-backed reactive properties.
 * Setting a property (or its attribute) calls `render<PropName>()` when connected,
 * instead of forcing a full `render()`. Pass `TProps` (a type with no index
 * signature, e.g. `{ label: string | null }`) to type the resulting properties.
 */
export function Component<TProps extends object = object>(
  tagName: string,
  attributeNames: readonly string[] = [],
  dependencies: readonly ComponentDependency[] = [],
): ComponentClass<TProps> {
  const propNames = attributeNames.map(toCamelCase);
  const htmlNames = propNames.map(toKebabCase);
  const idByInstance = new WeakMap<RawComponent, string>();

  class Base extends RawComponent {
    get componentId(): string {
      const instance = idByInstance.get(this);
      if (instance) {
        return instance;
      }
      const id = `${tagName}@${randomToken()}`;
      idByInstance.set(this, id);
      return id;
    }

    override attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
      (this as unknown as Record<string, unknown>)[toCamelCase(name)] = newValue;
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

    static define(): void {
      if (customElements.get(tagName)) return;
      for (const dep of dependencies) dep.define();
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
      get(this: RawComponent): string | null {
        return (this as unknown as Record<string, string | null>)[backingField] ?? null;
      },
      set(this: RawComponent, value: string | null) {
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

  return Base as unknown as ComponentClass<TProps>;
}
