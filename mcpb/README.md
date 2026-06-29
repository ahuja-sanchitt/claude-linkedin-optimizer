# LinkedIn Optimizer — Claude Desktop extension (`.mcpb`)

A Node/TypeScript port of the server, packaged as a one-click [MCP Bundle](https://github.com/modelcontextprotocol/mcpb) (`.mcpb`) for the **Claude Desktop app**. Claude Desktop bundles a Node runtime, so this installs and runs with **no Python and no dependencies** to set up — unlike a Python server, which Desktop can't run out of the box.

It runs **locally**, so it reads your LinkedIn PDF/DOCX straight off your disk (a remote connector can't).

## Install (end users)

1. Download `linkedin-optimizer.mcpb`.
2. Claude Desktop → **Settings → Extensions → Install Extension…** (or just double-click the file).
3. Confirm. Then in a chat, run the `optimize_linkedin` prompt, give it the path to your LinkedIn PDF export, and paste 3–5 target job descriptions.

## What it exposes

Identical behavior to the Python server (`../server.py`):

- **Tools:** `parse_profile`, `parse_jds`, `keyword_gap`, `lint_headline`, `lint_bullet`
- **Prompts:** `diagnostic`, `rewrite_headline_about`, `rewrite_experience`, `design_featured_skills`, `content_plan`, `optimize_linkedin`

The prompt `.md` files and `keyword_taxonomy.txt` are the canonical copies at the repo root, shared with the Python server and copied into the bundle at build time (no duplication in git).

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
