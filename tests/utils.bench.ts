import { describe, test } from "vitest";
import { toRenderMethodName } from "../src/utils";

describe("toRenderMethodName", () => {
  test("short property name", async ({ bench }) => {
    await bench("label", () => {
      toRenderMethodName("label");
    }).run();
  });
});
