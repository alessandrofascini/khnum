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

// Element.setAttribute's actual validation rule (not the stricter classic XML Name
// production): non-empty, and no ASCII whitespace, NUL, "/", ">", or "=" anywhere.
// See https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute.
function isInvalidAttrChar(code: number): boolean {
  return isWhitespace(code) || code === 0x00 || code === 0x2f || code === 0x3e || code === 0x3d;
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
    if (raw.length === 0) {
      throw new KhnumError("AttributeName", `"${raw}" is not a valid attribute name`);
    }

    // attributeName is a hyphen-before-lowercase encoding of the exact same "new segment"
    // decisions that drive propName's capitalization, so both are built together in one
    // pass over raw instead of validating once and converting twice.
    let propName = "";
    let attributeName = "";
    let started = false; // have we passed the leading run of non-alphanumeric characters?
    let prevWasWord = false; // for propName: capitalize the next word char after a separator
    let prevWasLower = false; // for attributeName: hyphenate before an uppercase propName char

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      const code = raw.charCodeAt(i);

      if (isInvalidAttrChar(code)) {
        throw new KhnumError("AttributeName", `"${raw}" is not a valid attribute name`);
      }

      if (!started) {
        if (!isAlnum(code)) continue; // still skipping the leading separator run
        started = true;
      } else if (ch === "-") {
        prevWasWord = false;
        continue;
      }

      let outChar: string;
      if (propName.length === 0) {
        outChar = ch.toLowerCase();
      } else if (isUpper(code)) {
        outChar = ch;
      } else if (isWordChar(code) && !prevWasWord) {
        outChar = ch.toUpperCase();
      } else {
        outChar = ch;
      }

      const outIsUpper = outChar >= "A" && outChar <= "Z";
      if (outIsUpper && prevWasLower) {
        attributeName += "-";
      }
      attributeName += outChar.toLowerCase();
      propName += outChar;

      prevWasWord = isWordChar(code);
      prevWasLower = outChar >= "a" && outChar <= "z";
    }

    this.propName = propName;
    this.attributeName = attributeName;
  }
}
