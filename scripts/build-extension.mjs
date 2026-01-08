import { build, context } from "esbuild";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist", "extension");

await mkdir(outDir, { recursive: true });

const buildOptions = {
  entryPoints: [resolve(root, "src", "extension", "extension.ts")],
  outfile: resolve(outDir, "extension.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  external: ["vscode"],
  sourcemap: true,
  logLevel: "info",
};

const watch = process.argv.includes("--watch");

if (!watch) {
  await build(buildOptions);
} else {
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log("esbuild: watching for changes");

  const shutdown = async () => {
    await ctx.dispose();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
