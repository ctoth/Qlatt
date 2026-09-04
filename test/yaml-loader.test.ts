import { expect, it } from "vitest";
import { parseYamlString } from "../src/yaml-loader";

it("parses a YAML mapping through the installed js-yaml module shape", () => {
  expect(parseYamlString<{ value: number }>("value: 43\n")).toEqual({ value: 43 });
});
