import {describe, test} from "vitest";
import {AttributeName} from "../../src/internal/attribute-name";

describe("AttributeName", () => {
  test("short vs long kebab-case input", async ({bench}) => {
    await bench.compare(
      bench("short: is-active", () => {
        new AttributeName("is-active");
      }),
      bench("long: many-segment attribute name", () => {
        new AttributeName("this-is-a-fairly-long-attribute-name-with-many-segments");
      }),
    );
  });

  test("short vs long camelCase input", async ({bench}) => {
    await bench.compare(
      bench("short: isActive", () => {
        new AttributeName("isActive");
      }),
      bench("long: many-segment property name", () => {
        new AttributeName("thisIsAFairlyLongPropertyNameWithManySegments");
      }),
    );
  });
});
