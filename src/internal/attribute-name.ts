import { KhnumError } from "../errors";

// ECMAScript's `\s` (WhiteSpace + LineTerminator code points), checked by code point
// instead of a regex.
function isWhitespace(code: number): boolean {
  return (
    code === 0x20 || // space
    code === 0x09 || // tab
    code === 0x0a || // \n
    code === 0x0b || // \v
    code === 0x0c || // \f
    code === 0x0d || // \r
    code === 0xa0 || // no-break space
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x3000 ||
    code === 0xfeff
  );
}

function isDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39; // 0-9
}

function isLower(code: number): boolean {
  return code >= 0x61 && code <= 0x7a; // a-z
}

function isUpper(code: number): boolean {
  return code >= 0x41 && code <= 0x5a; // A-Z
}

function isAlnum(code: number): boolean {
  return isLower(code) || isUpper(code) || isDigit(code);
}

function isWordChar(code: number): boolean {
  return isAlnum(code) || code === 0x5f; // + "_"
}

/**
 * Element.setAttribute's actual validation rule (not the stricter classic XML Name
 * production): non-empty, and no ASCII whitespace, NUL, "/", ">", or "=" anywhere.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute.
 */
function isValidAttributeName(value: string): boolean {
  if (value.length === 0) return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (isWhitespace(code) || code === 0x00 || code === 0x2f || code === 0x3e || code === 0x3d) {
      return false;
    }
  }
  return true;
}

function toPropName(value: string): string {
  // Skip a leading run of non-alphanumeric characters (e.g. "-", "_", ":") first, so the
  // first real character always lands at the start of the output and is treated as the
  // start of the identifier (lowercased) rather than as a word-boundary match (uppercased).
  let start = 0;
  while (start < value.length && !isAlnum(value.charCodeAt(start))) {
    start++;
  }

  let result = "";
  let prevWasWord = false;

  for (let i = start; i < value.length; i++) {
    const ch = value[i];
    const code = value.charCodeAt(i);

    if (isWhitespace(code) || ch === "-") {
      prevWasWord = false;
      continue;
    }

    if (i === start) {
      result += ch.toLowerCase();
    } else if (isUpper(code)) {
      result += ch;
    } else if (isWordChar(code) && !prevWasWord) {
      result += ch.toUpperCase();
    } else {
      result += ch;
    }

    prevWasWord = isWordChar(code);
  }

  return result;
}

function toAttrName(value: string): string {
  let result = "";
  let prevWasLower = false;
  let inSeparatorRun = false;

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    const code = value.charCodeAt(i);

    if (isWhitespace(code) || ch === "_") {
      if (!inSeparatorRun) {
        result += "-";
        inSeparatorRun = true;
      }
      prevWasLower = false;
      continue;
    }
    inSeparatorRun = false;

    if (isUpper(code) && prevWasLower) {
      result += "-";
    }
    result += ch;
    prevWasLower = isLower(code);
  }

  return result.toLowerCase();
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
    if (!isValidAttributeName(raw)) {
      throw new KhnumError("AttributeName", `"${raw}" is not a valid attribute name`);
    }
    this.propName = toPropName(raw);
    this.attributeName = toAttrName(this.propName);
  }
}
