import { describe, expect, it } from "vitest";
import { extractProviderJsonObject, parseProviderJsonObject } from "./providerJson.js";

describe("provider JSON parsing", () => {
  it("parses a fenced JSON object", () => {
    expect(parseProviderJsonObject('```json\n{"ok":true}\n```', "missing")).toEqual({ ok: true });
  });

  it("extracts the first fenced JSON object even with trailing prose", () => {
    expect(extractProviderJsonObject('```json\n{"ok":true}\n```\nHope this helps {"bad":true}', "missing")).toBe('{"ok":true}');
  });

  it("extracts JSON surrounded by provider prose", () => {
    expect(extractProviderJsonObject('说明：\n{"id":"001","summary":"完成"}\n请检查。', "missing")).toBe(
      '{"id":"001","summary":"完成"}'
    );
  });

  it("uses the caller-specific error when no object is present", () => {
    expect(() => parseProviderJsonObject("没有 JSON", "custom missing object")).toThrow("custom missing object");
  });
});
