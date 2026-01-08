import { z } from "zod";

const ProviderConfigSchema = z
  .object({
    enabled: z.boolean(),
    weight: z.number(),
  })
  .passthrough();

const DefaultsSchema = z
  .object({
    licensed: z.string(),
    unlicensed: z.string(),
  })
  .passthrough();

const LegacyPreferenceSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("class"), class: z.string() }).passthrough(),
    z.object({ kind: z.literal("explicit"), model: z.string() }).passthrough(),
  ]);

const ModelInfoSchema = z
  .object({
    reasoning: z.number().min(0).max(1),
    latency: z.number().min(0).max(1),
    cost: z.number().min(0).max(1),
    contextTokens: z.number().int().nonnegative(),
    tools: z.boolean(),
    vision: z.boolean(),
    tags: z.array(z.string()).default([]),
  })
  .passthrough();

export const RoutingFileSchema = z
  .object({
    version: z.literal(1),
    providers: z.record(z.string(), ProviderConfigSchema),
    defaults: DefaultsSchema,
    classes: z.record(z.string(), z.array(z.string())),
    legacyPreferenceMap: z.record(z.string(), LegacyPreferenceSchema).optional(),
    models: z.record(z.string(), ModelInfoSchema),
  })
  .passthrough();

export type RoutingFileParsed = z.infer<typeof RoutingFileSchema>;

export type ParseResult =
  | { ok: true; value: RoutingFileParsed }
  | {
      ok: false;
      message: string;
      issues?: { path: string; message: string }[];
    };

export function parseRoutingJsonText(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: `Invalid JSON: ${msg}` };
  }

  const result = RoutingFileSchema.safeParse(json);
  if (!result.success) {
    return {
      ok: false,
      message: "Schema validation failed.",
      issues: result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    };
  }

  // normalise tags: ensure each model has a tags array (schema default handles missing)
  for (const model of Object.values(result.data.models)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!Array.isArray(model.tags)) model.tags = [];
  }

  return { ok: true, value: result.data };
}
