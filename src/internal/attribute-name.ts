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
//
// Precomputed once: 1 for every printable ASCII code point (0x21-0x7e) except the 3
// forbidden ones ("/", "=", ">"), which stay 0. Turns "is this one of these 3 specific
// characters" into a single indexed read instead of three separate comparisons.
const PRINTABLE_ASCII_VALID = new Uint8Array(0x7f).fill(1, 0x21);
PRINTABLE_ASCII_VALID[0x2f] = 0;
PRINTABLE_ASCII_VALID[0x3d] = 0;
PRINTABLE_ASCII_VALID[0x3e] = 0;

// Fast path first: a letter, digit, or underscore is always valid, no further checks
// needed -- this is the overwhelming majority of real attribute-name characters. Otherwise
// plain printable ASCII is a single indexed lookup, and everything else falls back to the
// full isWhitespace scan (up to ~12 comparisons) for the rare remaining cases: control
// characters, ASCII space, and non-ASCII unicode whitespace.
function isValidAttrChar(code: number): boolean {
  if (isWordChar(code)) return true;
  if (code > 0x20 && code < 0x7f) {
    return Boolean(PRINTABLE_ASCII_VALID[code]);
  }
  return code !== 0x00 && !isWhitespace(code);
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
    this.propName = "";
    this.attributeName = "";
    let started = false; // have we passed the leading run of non-alphanumeric characters?
    let prevWasWord = false; // for propName: capitalize the next word char after a separator
    let prevWasLower = false; // for attributeName: hyphenate before an uppercase propName char

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      const code = raw.charCodeAt(i);

      if (!isValidAttrChar(code)) {
        throw new KhnumError("AttributeName", `"${raw}" is not a valid attribute name`);
      }

      if (!started) {
        if (!isWordChar(code)) continue; // still skipping the leading separator run
        started = true;
      } else if (ch === "-") {
        prevWasWord = false;
        continue;
      }

      let outChar: string;
      if (this.propName.length === 0) {
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
        this.attributeName += "-";
      }
      this.attributeName += outChar.toLowerCase();
      this.propName += outChar;

      prevWasWord = isWordChar(code);
      prevWasLower = outChar >= "a" && outChar <= "z";
    }
  }
}
