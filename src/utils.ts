export function toCamelCase(value: string): string {
  return value
    .replace(/^\w|[A-Z]|\b\w/g, (char, index) => (index === 0 ? char.toLowerCase() : char.toUpperCase()))
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

export function toKebabCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function renderMethodName(propName: string): string {
  return `render${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}

const ID_CHARS = "1234567890qwertyuiopasdfghjklzxcvbnmASDFGHJKLZXCVBNMQWERTYUIOP".split("");

export function randomId(length = 7): string {
  return Array.from({ length }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join("");
}
