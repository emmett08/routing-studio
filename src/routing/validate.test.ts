import { describe, expect, it } from "vitest";
import { parseRoutingJsonText } from "./schema";
import { validateRouting } from "./validate";
import { createStarterRoutingFile } from "./templates";

describe("routing schema + validation", () => {
  it("preserves unknown fields via passthrough", () => {
    const input = {
      version: 1,
      providers: { openai: { enabled: true, weight: 0, extraProvider: 123 } },
      defaults: { licensed: "default", unlicensed: "default", extraDefaults: true },
      classes: { default: ["openai:gpt-4o-mini"] },
      models: {
        "openai:gpt-4o-mini": {
          reasoning: 0.5,
          latency: 0.9,
          cost: 0.9,
          contextTokens: 128000,
          tools: true,
          vision: true,
          tags: [],
          extraModelField: "kept",
        },
      },
      topLevelExtra: { a: 1 },
    };

    const parsed = parseRoutingJsonText(JSON.stringify(input));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect((parsed.value as any).topLevelExtra).toEqual({ a: 1 });
    expect((parsed.value.providers.openai as any).extraProvider).toBe(123);
    expect((parsed.value.defaults as any).extraDefaults).toBe(true);
    expect((parsed.value.models["openai:gpt-4o-mini"] as any).extraModelField).toBe("kept");
  });

  it("detects invalid class references in defaults", () => {
    const routing = createStarterRoutingFile();
    routing.defaults.licensed = "missing";
    const issues = validateRouting(routing);
    expect(issues.some((i) => i.path === "defaults.licensed" && i.severity === "error")).toBe(true);
  });

  it("rejects invalid JSON text", () => {
    const parsed = parseRoutingJsonText("{");
    expect(parsed.ok).toBe(false);
  });
});

