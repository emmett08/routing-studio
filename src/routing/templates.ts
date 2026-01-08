import type { RoutingFileV1 } from "./types";

/**
 * A sensible starter file that mirrors the example structure while staying minimal.
 */
export function createStarterRoutingFile(): RoutingFileV1 {
  return {
    version: 1,
    providers: {
      openai: { enabled: true, weight: 0.0 },
    },
    defaults: {
      licensed: "default",
      unlicensed: "default",
    },
    classes: {
      default: ["openai:gpt-4o-mini"],
      frontier: ["openai:gpt-5.1", "openai:gpt-4.1"],
      fast: ["openai:gpt-4o-mini"],
      cheap: ["openai:gpt-4o-mini"],
    },
    legacyPreferenceMap: {},
    models: {
      "openai:gpt-4o-mini": {
        reasoning: 0.55,
        latency: 0.95,
        cost: 0.95,
        contextTokens: 128000,
        tools: true,
        vision: true,
        tags: ["tools", "vision", "fast", "cheap"],
      },
      "openai:gpt-4.1": {
        reasoning: 0.85,
        latency: 0.7,
        cost: 0.5,
        contextTokens: 128000,
        tools: true,
        vision: true,
        tags: ["tools", "vision", "long"],
      },
      "openai:gpt-5.1": {
        reasoning: 0.95,
        latency: 0.65,
        cost: 0.35,
        contextTokens: 200000,
        tools: true,
        vision: true,
        tags: ["tools", "vision", "frontier"],
      },
    },
  };
}
