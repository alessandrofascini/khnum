import { describe, test } from "vitest";
import { randomToken, toRenderMethodName } from "../src/utils";

describe("toRenderMethodName", () => {
  test("short property name", async ({ bench }) => {
    await bench("label", () => {
      toRenderMethodName("label");
    }).run();
  });
});

describe("randomToken", () => {
  test("default length vs length 100", async ({ bench }) => {
    await bench.compare(
      bench("default length (7)", () => {
        randomToken();
      }),
      bench("length 100", () => {
        randomToken(100);
      }),
    );
  });
});
