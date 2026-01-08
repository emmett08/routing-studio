import type { RoutingUiConfig } from "./types";

export const defaultUiConfig: RoutingUiConfig = {
  metricDefinitions: [
    {
      key: "reasoning",
      label: "Reasoning",
      description: "0..1 where higher means better reasoning/quality.",
      min: 0,
      max: 1,
      step: 0.05,
      higherIsBetter: true,
    },
    {
      key: "latency",
      label: "Speed",
      description: "0..1 where higher means faster (lower latency).",
      min: 0,
      max: 1,
      step: 0.05,
      higherIsBetter: true,
    },
    {
      key: "cost",
      label: "Cost efficiency",
      description: "0..1 where higher means cheaper / better value.",
      min: 0,
      max: 1,
      step: 0.05,
      higherIsBetter: true,
    },
  ],
  classMeta: {
    default: {
      key: "default",
      label: "Default",
      description: "Balanced routing for general usage.",
    },
    frontier: {
      key: "frontier",
      label: "Frontier",
      description: "Highest capability models (often higher cost).",
    },
    fast: {
      key: "fast",
      label: "Fast",
      description: "Low latency models.",
    },
    cheap: {
      key: "cheap",
      label: "Cheap",
      description: "Low cost models.",
    },
    long: {
      key: "long",
      label: "Long context",
      description: "Models suited to long context windows.",
    },
  },
};

const LS_KEY = "routing-studio.ui-config.v1";

export function loadUiConfig(): RoutingUiConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultUiConfig;
    const parsed = JSON.parse(raw) as RoutingUiConfig;
    // Very light validation — if missing, fall back
    if (!parsed.metricDefinitions?.length) return defaultUiConfig;
    if (!parsed.classMeta) return defaultUiConfig;
    return parsed;
  } catch {
    return defaultUiConfig;
  }
}

export function saveUiConfig(cfg: RoutingUiConfig): void {
  localStorage.setItem(LS_KEY, JSON.stringify(cfg));
}
