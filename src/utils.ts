export function toRenderMethodName(propName: string): string {
  return `render${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}

const TOKEN_CHARS = "1234567890qwertyuiopasdfghjklzxcvbnmASDFGHJKLZXCVBNMQWERTYUIOP".split("");

export function randomToken(length = 7): string {
  return Array.from({ length }, () => TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]).join("");
}
