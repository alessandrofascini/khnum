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

export function makeComponentId(): string {
  counter = (counter + 1) & 0xffffff;
  const timestamp = Math.floor(Date.now() / 1000);

  const bytes = new Uint8Array(12);
  bytes[0] = (timestamp >>> 24) & 0xff;
  bytes[1] = (timestamp >>> 16) & 0xff;
  bytes[2] = (timestamp >>> 8) & 0xff;
  bytes[3] = timestamp & 0xff;
  bytes.set(SESSION_ID, 4);
  bytes[9] = (counter >>> 16) & 0xff;
  bytes[10] = (counter >>> 8) & 0xff;
  bytes[11] = counter & 0xff;

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
