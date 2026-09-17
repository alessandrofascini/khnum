import { Component, type AttributeMap, type ComponentClass, type ComponentDependency } from "./component";
import { toCamelCase } from "./utils";

type AnyComponentClass = ComponentClass<AttributeMap>;

/** Fluent builder that composes several components into one container custom element. */
export class MultiComponentBuilder {
  #tagName: string;
  #components = new Set<AnyComponentClass>();
  #attributeNames = new Set<string>();
  #dependencies = new Set<ComponentDependency>();

  constructor(tagName: string) {
    this.#tagName = tagName;
  }

  attributeNames(...names: string[]): this {
    for (const name of names) this.#attributeNames.add(name);
    return this;
  }

  dependencies(...dependencies: ComponentDependency[]): this {
    for (const dep of dependencies) this.#dependencies.add(dep);
    return this;
  }

  use(...components: AnyComponentClass[]): this {
    for (const component of components) {
      this.#components.add(component);
      for (const attr of component.attributeNames) this.#attributeNames.add(attr);
      this.#dependencies.add(component);
    }
    return this;
  }

  build(): AnyComponentClass {
    const components = Array.from(this.#components);
    const attributeNames = Array.from(this.#attributeNames);
    const dependencies = Array.from(this.#dependencies);
    const tagName = this.#tagName;

    class Container extends Component(tagName, attributeNames, dependencies) {
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

      static define(): void {
        if (customElements.get(tagName)) return;
        for (const dep of dependencies) dep.define();
        customElements.define(tagName, this);
      }
    }

    return Container as unknown as AnyComponentClass;
  }
}
