# LinkedIn Optimizer — Claude Desktop extension (`.mcpb`)

A Node/TypeScript MCP server, packaged as a one-click [MCP Bundle](https://github.com/modelcontextprotocol/mcpb) (`.mcpb`) for the **Claude Desktop app**. Claude Desktop bundles a Node runtime, so this installs and runs with **no Python and no dependencies** to set up.

It runs **locally**, so it can read your LinkedIn PDF/DOCX off your disk (a remote connector can't) — though in normal use you just attach the file in chat.

## Install (end users)

See the [main README](../README.md#install): download `linkedin-optimizer.mcpb` from the latest release, then in Claude Desktop go to **Settings → Extensions → Advanced settings → Install Extension** and select it.

## What it exposes

- **Tools:** `parse_profile`, `parse_jds`, `keyword_gap`, `lint_headline`, `lint_bullet`
- **Prompts:** `diagnostic`, `rewrite_headline_about`, `rewrite_experience`, `design_featured_skills`, `content_plan`, `optimize_linkedin`

The prompt `.md` files and `keyword_taxonomy.txt` are the canonical copies at the repo root, copied into the bundle at build time (no duplication in git).

## Build (developers)

```bash
cd mcpb
npm install
npm run build      # esbuild → build/index.js (single file, all deps inlined)
node smoketest.mjs # spawns the bundle, lists tools/prompts, runs a few calls
npm run pack       # build + produce linkedin-optimizer.mcpb
```

- **`src/index.ts`** — the server (MCP TypeScript SDK).
- **`build.mjs`** — bundles `src/` and copies the shared `../prompts` + `../resources` into `build/`.
- **`manifest.json`** — declares the Node server. Tools/prompts are discovered at runtime via MCP; the manifest lists tools for the directory and leaves prompts to `prompts/list`.
- PDF parsing uses [`unpdf`](https://github.com/unjs/unpdf) (a modern pdf.js build); DOCX uses [`mammoth`](https://github.com/mwilliamson/mammoth.js). Both are pure JS and bundle cleanly.
