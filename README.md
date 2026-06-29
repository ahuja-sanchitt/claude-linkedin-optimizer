# LinkedIn Optimizer MCP

An MCP server that turns a set of expert recruiter prompts into a **one-command LinkedIn optimizer**. Give Claude your LinkedIn profile (a PDF or DOCX export) and a few target job descriptions, and it runs a full optimization: an honest recruiter-style diagnostic, then rewrites of your headline, About, experience bullets, Featured section, Skills, and a 4-week content plan — all copy-paste ready, with a chat to refine.

The model does the rewriting. This server does the parts a model can't do reliably on its own: parse your files, count which keywords appear across the JDs, and validate character limits and banned words.

It ships for **two clients**: a one-click extension for the **Claude Desktop app** (recommended) and a Python server for **Claude Code**. Both run locally, so your profile never leaves your machine.

## Why an MCP (not just prompts)

The methodology is five strong prompts. The problem: most people won't hunt them down, paste them in the right order, and remember to feed in their profile and JDs first. Packaging it as an installable server means you set it up once, then just hand over your profile and go — and the deterministic checks (keyword counts, character limits, banned words) run automatically instead of being suggestions the model might skip.

## What's inside

**Prompts** — the methodology. *How you invoke them depends on the client:* in the **Claude Desktop app** they appear in the `+` menu (or you just ask naturally); in **Claude Code** they're slash commands like `/linkedin-optimizer:diagnostic`.
- `diagnostic` — brutally honest recruiter gap analysis (identity / keyword / credibility / search / one-line)
- `rewrite_headline_about` — headline (3 ranked) + About (2 versions)
- `rewrite_experience` — bullets rewritten as `verb + scope + metric + impact`
- `design_featured_skills` — Featured slots, Skills, endorsement DMs
- `content_plan` — 4-week posting calendar
- `optimize_linkedin` — orchestrator that ingests your profile + JDs and runs all five in order

**Tools** (deterministic helpers the prompts lean on):
- `parse_profile(file_path)` — extract text from a `.pdf` or `.docx`
- `parse_jds(text_or_path)` — accept pasted JD text or a file
- `keyword_gap(profile_text, jd_texts, min_jds)` — terms in N+ JDs missing from the profile
- `lint_headline(text, max_chars, must_include)` — length / banned-word / keyword check
- `lint_bullet(text)` — flags bullets missing a metric or opening with a weak verb

## Install

First, get the code (needed for the Claude Code path and for building the Desktop extension from source):

```bash
git clone https://github.com/ahuja-sanchitt/claude-linkedin-optimizer.git
cd claude-linkedin-optimizer
```

> Just want the Desktop extension and not the source? Grab the prebuilt `linkedin-optimizer.mcpb` from the repo's **Releases** page instead and skip straight to the install step below — no clone needed.

Then pick your client:

### Claude Desktop app — one-click extension (recommended)

A Node/TypeScript build is packaged as a [`.mcpb`](https://github.com/modelcontextprotocol/mcpb) bundle that installs in one click, with **no Python and nothing to configure** (Claude Desktop ships a Node runtime). It runs locally, so your profile never leaves your machine.

**Download and install:**
1. Grab `linkedin-optimizer.mcpb` from the [latest release](https://github.com/ahuja-sanchitt/claude-linkedin-optimizer/releases/latest).
2. In Claude Desktop, go to **Settings → Extensions → Install Extension…** and select the downloaded file.

*(Double-clicking the `.mcpb` also works **if** your system has associated it with Claude Desktop — but the Settings → Extensions route always works, so use that if double-click just offers you Notepad/your editor.)*

> **Heads-up:** this is an open-source community extension, not signed by a verified publisher, so Claude Desktop will warn it's "from an unidentified developer." That's expected for any independent extension — the full source is in this repo, so you can review it (or build it yourself) before clicking through to install.

**Building from source instead:** run the helper, which builds the bundle and opens the installer for you (Claude Desktop confirms the install in a dialog — that step is intentionally not silent):

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File scripts\install-desktop.ps1
```
```bash
# macOS / Linux
bash scripts/install-desktop.sh
```

See [`mcpb/README.md`](mcpb/README.md) for details.

### Claude Code — Python server

Requires Python 3.10+ and [Claude Code](https://claude.com/claude-code).

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

**macOS / Linux:**
```bash
bash scripts/install.sh
```

The script creates a virtualenv, installs dependencies, and registers the server with Claude Code at user scope. Restart Claude Code afterward.

## Use

It runs the full flow, pausing after each stage so you can react and request changes — exactly like working with a recruiter friend.

### Claude Desktop app

1. Start a **new chat** (extensions load per conversation).
2. **Attach** your profile (the paperclip / "Add files or photos") and paste 3–5 target job descriptions.
3. Pick **LinkedIn Optimizer → optimize_linkedin** from the `+` menu, or just ask: *"Optimize my LinkedIn profile, be a brutally honest recruiter."*

> **Attach or path — both work.** Attaching is easiest: Claude reads the file directly and the deterministic checks still run. The `parse_profile` tool is only needed when you give an actual file path (it can't read an attachment, since attachments aren't exposed to tools as a path).

### Claude Code

```
/linkedin-optimizer:optimize_linkedin
```
Give it the path to your LinkedIn PDF/DOCX export and paste 3–5 target job descriptions. You can also run any stage on its own, e.g. `/linkedin-optimizer:diagnostic`.

## Customize

- **`resources/keyword_taxonomy.txt`** — the keyword list `keyword_gap` checks against. Add the terms that matter for your target roles.
- **`prompts/*.md`** — the methodology. Edit any prompt's rules to taste.

## Roadmap

- `consistency_check` tool: diff titles, dates, and metrics across LinkedIn vs resume.
- Smarter keyword extraction (n-grams + frequency) instead of a fixed taxonomy.
- A `search_visibility` heuristic that scores how a profile ranks for likely recruiter queries.

## License

MIT
