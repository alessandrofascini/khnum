import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { KhnumError } from "../src/errors";

describe("KhnumError", () => {
  it("is a real Error with name 'KhnumError' and the given message", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (functionName, message) => {
        const error = new KhnumError(functionName, message);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe("KhnumError");
        expect(error.functionName).toBe(functionName);
        expect(error.message).toBe(message);
      }),
      { numRuns: 200 },
    );
  });

  it("toString() formats as 'Khnum.<functionName>: <message>'", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (functionName, message) => {
        const error = new KhnumError(functionName, message);
        expect(error.toString()).toBe(`Khnum.${functionName}: ${message}`);
      }),
      { numRuns: 200 },
    );
  });

  it("pinned example", () => {
    const error = new KhnumError("mold", "is not implemented");
    expect(error.toString()).toBe("Khnum.mold: is not implemented");
  });
});
