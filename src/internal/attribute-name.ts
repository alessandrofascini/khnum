import { KhnumError } from "../errors";

// Element.setAttribute's actual validation rule (not the stricter classic XML Name
// production): non-empty, and no ASCII whitespace, NUL, "/", ">", or "=" anywhere.
// See https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute.
const INVALID_CHARS = /[\0\s/>=]/;

function toPropName(value: string): string {
  return value
    // Strip a leading run of non-alphanumeric characters (e.g. "-", ":") first, so the
    // first real character always lands at index 0 and is treated as the start of the
    // identifier (lowercased) rather than as a word-boundary match (uppercased).
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/^\w|[A-Z]|\b\w/g, (char, index) => (index === 0 ? char.toLowerCase() : char.toUpperCase()))
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function toAttrName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * A validated HTML attribute name, and the single source of truth for converting
 * between an attribute's kebab-case form and its JS property's camelCase form.
 * Accepts either form as input (`"is-active"` or `"isActive"`).
 */
export class AttributeName {
  readonly propName: string;
  readonly attributeName: string;

  constructor(raw: string) {
    if (raw.length === 0 || INVALID_CHARS.test(raw)) {
      throw new KhnumError("AttributeName", `"${raw}" is not a valid attribute name`);
    }
    this.propName = toPropName(raw);
    this.attributeName = toAttrName(this.propName);
  }
}
