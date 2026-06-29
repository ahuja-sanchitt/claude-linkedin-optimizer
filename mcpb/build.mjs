/**
 * Build the .mcpb staging directory:
 *   1. Bundle src/index.ts (+ all deps) into a single build/index.js via esbuild.
 *   2. Copy the manifest and the shared prompts/ + resources/ in alongside it.
 *
 * The canonical prompts/ and resources/ live at the repo root and are shared with
 * the Python server; we copy them in at build time so the bundle is self-contained
 * without duplicating them in git. Then: `mcpb pack build linkedin-optimizer.mcpb`.
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(HERE, "build");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

await build({
  entryPoints: [join(HERE, "src", "index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: join(OUT, "index.js"),
  // ESM output needs these shims for CJS deps that reference require/__dirname.
  banner: {
    js: "import{createRequire as __cr}from'node:module';import{fileURLToPath as __fp}from'node:url';import{dirname as __dn}from'node:path';const require=__cr(import.meta.url);const __filename=__fp(import.meta.url);const __dirname=__dn(__filename);",
  },
});

copyFileSync(join(HERE, "manifest.json"), join(OUT, "manifest.json"));
cpSync(join(ROOT, "prompts"), join(OUT, "prompts"), { recursive: true });
cpSync(join(ROOT, "resources"), join(OUT, "resources"), { recursive: true });

console.log("Built ->", OUT);
