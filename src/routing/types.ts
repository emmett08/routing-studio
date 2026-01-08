export type ProviderId = string;
export type ModelId = string; // e.g. "openai:gpt-5.1"
export type ClassName = string;

export interface ProviderConfig {
  enabled: boolean;
  /** Provider bias. Negative favours the provider; positive penalises. */
  weight: number;
  [k: string]: unknown;
}

export interface DefaultsConfig {
  /** Class key used when the user is licensed. */
  licensed: ClassName;
  /** Class key used when the user is unlicensed. */
  unlicensed: ClassName;
  [k: string]: unknown;
}

export type LegacyPreference =
  | { kind: "class"; class: ClassName; [k: string]: unknown }
  | { kind: "explicit"; model: ModelId; [k: string]: unknown };

export interface ModelInfo {
  /** 0..1 where higher = better reasoning/quality. */
  reasoning: number;
  /** 0..1 where higher = faster/lower latency. */
  latency: number;
  /** 0..1 where higher = cheaper/better cost efficiency. */
  cost: number;

  contextTokens: number;
  tools: boolean;
  vision: boolean;
  tags: string[];

  /** Extra, forwards-compatible fields */
  [k: string]: unknown;
}

/**
 * Routing file v1 (based on the attached example).
 * Unknown fields are preserved to stay forwards-compatible.
 */
export interface RoutingFileV1 {
  version: 1;
  providers: Record<ProviderId, ProviderConfig>;
  defaults: DefaultsConfig;
  classes: Record<ClassName, ModelId[]>;
  legacyPreferenceMap?: Record<string, LegacyPreference>;
  models: Record<ModelId, ModelInfo>;
  [k: string]: unknown;
}

export type Severity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: Severity;
  path: string;
  message: string;
}

export interface MetricDefinition {
  key: string;
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  higherIsBetter: boolean;
}

export type ClassRule =
  | { type: "tag"; tag: string }
  | {
      type: "metric";
      metric: string;
      op: ">=" | "<=" | ">" | "<";
      value: number;
    };

export interface ClassMeta {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  rules?: ClassRule[];
}

export interface RoutingUiConfig {
  metricDefinitions: MetricDefinition[];
  classMeta: Record<string, ClassMeta>;
}
