# Decision Log

Append-only record of non-trivial decisions. Never edit or delete past entries;
if a decision is reversed, add a new entry and mark the old one
`Superseded by D-0XX`.

---

## D-001 — Ship as a local MCP server (not a web app or Claude Skill)

**Phase:** Project inception

**Decision:** Build the optimizer as a local stdio MCP server for Claude Code, distributed with a one-command install script.

**Options considered:**
- **Web app (extend an existing React/FastAPI/LLM stack)** — zero setup for end users, reaches non-technical people, but is a full app to build and host, plus API cost per run.
- **Claude Skill** — simplest to build, but only usable inside Claude Code by developers; no deterministic tooling.
- **Remote MCP connector** — low user setup, but excludes free users and requires hosting.
- **Local MCP server (chosen)** — developer/prosumer audience already adds MCPs (Drive, Notion, etc.); an install script removes the config-editing friction; doubles as a Backend + AI portfolio piece.

**Reason:** The target audience already connects MCP servers, and a one-line installer (`claude mcp add`) collapses the setup objection. It keeps all logic local (no hosting, no per-run API bill) and showcases real backend + AI engineering.

---

## D-002 — MCP "prompts" carry the methodology; "tools" do only the deterministic work

**Phase:** Architecture

**Decision:** Encode the five recruiter prompts as MCP prompts (slash commands); implement only deterministic helpers as tools (parsing, keyword-gap, linters). The calling model does all rewriting.

**Options considered:**
- **Tools do everything (call an LLM inside the server)** — more "magic," but duplicates the host model, adds an API key + cost, and is harder to trust/inspect.
- **Prompts + deterministic tools (chosen)** — the host Claude does the reasoning; the server only does what a model can't reliably do itself (parse files, count keyword frequencies, validate char limits/banned words).

**Reason:** Cleanest separation, no second LLM or API key, fully inspectable, and the prompts stay easy to edit. Ships fast and matches how MCP is meant to be used.

---

## D-003 — Keyword gap via an editable taxonomy file (v1)

**Phase:** Tooling

**Decision:** `keyword_gap` checks JDs against a fixed, user-editable list in `resources/keyword_taxonomy.txt` rather than extracting keywords automatically.

**Options considered:**
- **Automatic extraction (n-grams, TF-IDF, NER)** — adapts to any field, but noisy, heavier, and harder to make deterministic for v1.
- **Fixed taxonomy (chosen)** — predictable, transparent, trivially tunable per target role; weakness is it only catches terms on the list.

**Reason:** Deterministic and shippable now; smarter extraction is on the roadmap. Users can edit the list for their domain in seconds.

---

## D-004 — Ship a Node/TypeScript `.mcpb` extension for the Claude Desktop app, alongside the Python server for Claude Code

**Phase:** Distribution

**Decision:** Add a second implementation in `mcpb/` — the same server ported to Node/TypeScript — packaged as a one-click `.mcpb` bundle for the Claude Desktop app. The Python server (`server.py`) stays as the Claude Code path. Both share the canonical `prompts/` and `resources/`, copied into the bundle at build time.

**Context:** `D-001` chose a local server specifically so it can read the user's LinkedIn file off local disk. The goal here was the best Claude Desktop experience.

**Options considered:**
- **Remote connector (hosted, in the directory)** — the most "connector-like," but can't read a local file (the user would have to upload their PDF), and reintroduces hosting + per-run cost that `D-001` avoided. Wrong fit for a tool whose first step is parsing a local file.
- **Bundle the existing Python server as `.mcpb`** — reuses all code, but Claude Desktop ships a Node runtime, not Python; a Python bundle needs the user to have Python and can't portably bundle compiled deps (pydantic, pdfplumber). Fragile, undercuts the one-click goal.
- **Port to Node/TypeScript `.mcpb` (chosen)** — truly one-click and zero-dependency for end users, since Desktop runs Node out of the box. Anthropic's recommended path for Desktop extensions. Cost: a second implementation to keep in parity.

**Reason:** It's the only option that is both local (can read the user's PDF) and genuinely one-click. Parity risk is contained by sharing the prompt/resource files and keeping the tool/prompt logic small and deterministic. PDF parsing uses `unpdf` (modern pdf.js) after `pdf-parse`'s 2016-era pdf.js failed on a valid test PDF (`bad XRef entry`); DOCX uses `mammoth`. Both are pure JS and bundle cleanly via esbuild.
