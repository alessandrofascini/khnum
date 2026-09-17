import { WebComponentsFactoryError } from "./errors";

export type MoldStyle = Partial<Record<keyof CSSStyleDeclaration, string | undefined>>;
export type MoldAttributes = Record<string, unknown> & { style?: MoldStyle };
export type MoldChild = Node | string | null | undefined;

type MoldTarget = string | (new () => HTMLElement);

function applyAttributes(el: HTMLElement, props: MoldAttributes): void {
  const { style, ...attrs } = props;
  if (style) {
    for (const [prop, value] of Object.entries(style)) {
      if (value !== undefined) el.style.setProperty(prop, value);
    }
  }
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }
}

/** Hyperscript-style element factory. `props` may be an attributes object, or omitted in favor of a first child. */
export function mold<T extends HTMLElement = HTMLElement>(
  target: MoldTarget,
  propsOrChild?: MoldAttributes | MoldChild,
  ...children: MoldChild[]
): T {
  const el = (typeof target === "string" ? document.createElement(target) : new target()) as T;

  if (propsOrChild != null) {
    if (propsOrChild instanceof Node || typeof propsOrChild === "string") {
      el.append(propsOrChild);
    } else if (typeof propsOrChild === "object") {
      applyAttributes(el, propsOrChild as MoldAttributes);
    } else {
      throw new WebComponentsFactoryError(
        "mold",
        `Invalid type of props: "${typeof propsOrChild}". Type can only be Node | Object | string.`,
      );
    }
  }

  for (const child of children) {
    if (child != null) el.append(child);
  }

  return el;
}
