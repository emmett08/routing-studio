import type { ClassRule, RoutingFileV1, ValidationIssue } from "./types";

function providerOf(modelId: string): string | null {
  const idx = modelId.indexOf(":");
  if (idx <= 0) return null;
  return modelId.slice(0, idx);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function validateRouting(routing: RoutingFileV1): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const classKeys = new Set(Object.keys(routing.classes ?? {}));
  const modelKeys = new Set(Object.keys(routing.models ?? {}));
  const providerKeys = new Set(Object.keys(routing.providers ?? {}));

  // Defaults should point to existing classes
  if (!classKeys.has(routing.defaults.licensed)) {
    issues.push({
      severity: "error",
      path: "defaults.licensed",
      message: `Unknown class '${routing.defaults.licensed}'.`,
    });
  }
  if (!classKeys.has(routing.defaults.unlicensed)) {
    issues.push({
      severity: "error",
      path: "defaults.unlicensed",
      message: `Unknown class '${routing.defaults.unlicensed}'.`,
    });
  }

  // Classes must reference known models (or warn if not)
  for (const [className, seq] of Object.entries(routing.classes ?? {})) {
    if (seq.length === 0) {
      issues.push({
        severity: "warning",
        path: `classes.${className}`,
        message: "Empty class: routing will have no fallbacks.",
      });
    }
    const dupes = seq.filter((m, i) => seq.indexOf(m) !== i);
    if (dupes.length) {
      issues.push({
        severity: "warning",
        path: `classes.${className}`,
        message: `Duplicate model entries: ${uniq(dupes).join(", ")}.`,
      });
    }

    seq.forEach((modelId, i) => {
      if (!modelKeys.has(modelId)) {
        issues.push({
          severity: "warning",
          path: `classes.${className}[${i}]`,
          message: `Model '${modelId}' is not defined in 'models'. It will route, but you lose metadata & scoring.`,
        });
      }
      const p = providerOf(modelId);
      if (p && !providerKeys.has(p)) {
        issues.push({
          severity: "warning",
          path: `classes.${className}[${i}]`,
          message: `Provider '${p}' is not defined in 'providers'.`,
        });
      }
    });
  }

  // Models should have provider declared
  for (const modelId of modelKeys) {
    const p = providerOf(modelId);
    if (p && !providerKeys.has(p)) {
      issues.push({
        severity: "warning",
        path: `models.${modelId}`,
        message: `Model provider '${p}' is missing from 'providers'.`,
      });
    }
  }

  // Providers: ensure at least one enabled
  const enabledProviders = Object.entries(routing.providers ?? {}).filter(
    ([, cfg]) => cfg.enabled,
  );
  if (Object.keys(routing.providers ?? {}).length > 0 && enabledProviders.length === 0) {
    issues.push({
      severity: "error",
      path: "providers",
      message: "All providers are disabled. Routing will have no valid targets.",
    });
  }

  // Legacy preference map integrity
  const legacy = routing.legacyPreferenceMap ?? {};
  for (const [k, v] of Object.entries(legacy)) {
    if (v.kind === "class" && !classKeys.has(v.class)) {
      issues.push({
        severity: "warning",
        path: `legacyPreferenceMap.${k}`,
        message: `Legacy key maps to unknown class '${v.class}'.`,
      });
    }
    if (v.kind === "explicit" && !modelKeys.has(v.model)) {
      issues.push({
        severity: "warning",
        path: `legacyPreferenceMap.${k}`,
        message: `Legacy key maps to unknown model '${v.model}'.`,
      });
    }
  }

  return issues;
}

export function suggestModelsForClass(
  routing: RoutingFileV1,
  rules: ClassRule[],
): string[] {
  const models = routing.models ?? {};
  const out: string[] = [];

  const cmp = (op: string, a: number, b: number) => {
    if (op === ">=") return a >= b;
    if (op === "<=") return a <= b;
    if (op === ">") return a > b;
    if (op === "<") return a < b;
    return false;
  };

  for (const [id, info] of Object.entries(models)) {
    let ok = true;
    for (const r of rules) {
      if (r.type === "tag") {
        if (!info.tags?.includes(r.tag)) {
          ok = false;
          break;
        }
      } else {
        const val = Number((info as any)[r.metric]);
        if (!Number.isFinite(val) || !cmp(r.op, val, r.value)) {
          ok = false;
          break;
        }
      }
    }
    if (ok) out.push(id);
  }

  // Stable, predictable ordering: best reasoning first as a default
  out.sort((a, b) => (routing.models[b]?.reasoning ?? 0) - (routing.models[a]?.reasoning ?? 0));
  return out;
}
