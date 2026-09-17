import { Shape, type AttributeMap, type Fireable, type Vessel } from "./shape";
import { toCamelCase } from "./utils";

type AnyVessel = Vessel<AttributeMap>;

/** Fluent builder that composes several vessels into one container custom element. */
export class Ennead {
  #tagName: string;
  #components = new Set<AnyVessel>();
  #attributeNames = new Set<string>();
  #dependencies = new Set<Fireable>();

  constructor(tagName: string) {
    this.#tagName = tagName;
  }

  attributeNames(...names: string[]): this {
    for (const name of names) this.#attributeNames.add(name);
    return this;
  }

  dependencies(...dependencies: Fireable[]): this {
    for (const dep of dependencies) this.#dependencies.add(dep);
    return this;
  }

  use(...components: AnyVessel[]): this {
    for (const component of components) {
      this.#components.add(component);
      for (const attr of component.attributeNames) this.#attributeNames.add(attr);
      this.#dependencies.add(component);
    }
    return this;
  }

  build(): AnyVessel {
    const components = Array.from(this.#components);
    const attributeNames = Array.from(this.#attributeNames);
    const dependencies = Array.from(this.#dependencies);
    const tagName = this.#tagName;

    class Container extends Shape(tagName, attributeNames, dependencies) {
      render(): void {
        this.replaceChildren(
          ...components.map((ChildComponent) => {
            const child = new ChildComponent();
            for (const attr of ChildComponent.attributeNames) {
              const value = (this as unknown as Record<string, string | null>)[toCamelCase(attr)];
              if (value != null) child.setAttribute(attr, value);
            }
            return child;
          }),
        );
      }

      attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        for (const node of Array.from(this.childNodes)) {
          (node as ChildNode & { attributeChangedCallback?: (n: string, o: string | null, v: string | null) => void })
            .attributeChangedCallback?.(name, oldValue, newValue);
        }
      }

      static fire(): void {
        if (customElements.get(tagName)) return;
        for (const dep of dependencies) dep.fire();
        customElements.define(tagName, this);
      }
    }

    return Container as unknown as AnyVessel;
  }
}
