export function toRenderMethodName(propName: string): string {
  return `render${propName.charAt(0).toUpperCase()}${propName.slice(1)}`;
}

// Same 12-byte layout as MongoDB's ObjectId: a 4-byte seconds-since-epoch timestamp, a 5-byte
// value randomized once per session (standing in for Mongo's machine+process identifier, since
// there's no such concept in a browser tab), and a 3-byte counter seeded randomly and
// incremented per call. Two ids only collide if this session generates the same counter value
// (i.e. wraps all 16,777,216 of them) within the same one-second timestamp.
const SESSION_SEED = crypto.getRandomValues(new Uint8Array(8));
const SESSION_ID = SESSION_SEED.subarray(0, 5);
let counter = (SESSION_SEED[5] << 16) | (SESSION_SEED[6] << 8) | SESSION_SEED[7];

// Precomputed once: the id's middle 5 bytes never change for the life of the session, so
// there's no need to re-encode them (or build an intermediate byte array) on every call.
let sessionIdHex = "";
for (const byte of SESSION_ID) sessionIdHex += byte.toString(16).padStart(2, "0");

export function makeComponentId(): string {
  counter = (counter + 1) & 0xffffff;
  // >>> 0 matches the old per-byte extraction's implicit ToUint32 truncation for timestamps
  // past 2106 (2**32 seconds since epoch).
  const timestamp = Math.floor(Date.now() / 1000) >>> 0;

  return (
    timestamp.toString(16).padStart(8, "0") + sessionIdHex + counter.toString(16).padStart(6, "0")
  );
}
