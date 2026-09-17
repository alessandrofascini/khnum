import { describe, test } from "vitest";
import { randomToken, toCamelCase, toKebabCase, toRenderMethodName } from "../src/utils";

describe("toCamelCase", () => {
  test("short vs long kebab-case input", async ({ bench }) => {
    await bench.compare(
      bench("short: is-active", () => {
        toCamelCase("is-active");
      }),
      bench("long: many-segment attribute name", () => {
        toCamelCase("this-is-a-fairly-long-attribute-name-with-many-segments");
      }),
    );
  });
});

describe("toKebabCase", () => {
  test("short vs long camelCase input", async ({ bench }) => {
    await bench.compare(
      bench("short: isActive", () => {
        toKebabCase("isActive");
      }),
      bench("long: many-segment property name", () => {
        toKebabCase("thisIsAFairlyLongPropertyNameWithManySegments");
      }),
    );
  });
});

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
