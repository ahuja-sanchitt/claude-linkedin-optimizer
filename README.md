# LinkedIn Optimizer MCP

An MCP server that turns a set of expert recruiter prompts into a **one-command LinkedIn optimizer**. Upload your LinkedIn profile (PDF export) and a few target job descriptions, and Claude runs a full optimization: an honest recruiter-style diagnostic, then rewrites of your headline, About, experience bullets, Featured section, Skills, and a 4-week content plan — all copy-paste ready, with a chat to refine.

The model does the rewriting. This server does the parts a model can't do reliably on its own: parse your files, count which keywords appear across the JDs, and validate character limits and banned words.

## Why an MCP (not just prompts)

The methodology is five strong prompts. The problem: most people won't hunt them down, paste them in the right order, and remember to feed in their profile and JDs first. This packages all of that into slash commands so any Claude Code user just runs one command.

## What's inside

**Prompts** (run as slash commands):
- `diagnostic` — brutally honest recruiter gap analysis (identity / keyword / credibility / search / one-line)
- `rewrite_headline_about` — headline (3 ranked) + About (2 versions)
- `rewrite_experience` — bullets rewritten as `verb + scope + metric + impact`
- `design_featured_skills` — Featured slots, Skills, endorsement DMs
- `content_plan` — 4-week posting calendar
- `optimize_linkedin` — orchestrator that parses your files and runs all five in order

**Tools** (deterministic helpers the prompts lean on):
- `parse_profile(file_path)` — extract text from a `.pdf` or `.docx`
- `parse_jds(text_or_path)` — accept pasted JD text or a file
- `keyword_gap(profile_text, jd_texts, min_jds)` — terms in N+ JDs missing from the profile
- `lint_headline(text, max_chars, must_include)` — length / banned-word / keyword check
- `lint_bullet(text)` — flags bullets missing a metric or opening with a weak verb

## Install

Two ways to run it, depending on your client:

### Claude Desktop app — one-click extension (recommended)

A Node/TypeScript build is packaged as a [`.mcpb`](https://github.com/modelcontextprotocol/mcpb) bundle that installs in one click, with **no Python and nothing to configure** (Claude Desktop ships a Node runtime). It runs locally, so it reads your LinkedIn PDF straight off your disk.

1. Get `mcpb/linkedin-optimizer.mcpb` (download it, or build it: `cd mcpb && npm install && npm run pack`).
2. Claude Desktop → **Settings → Extensions → Install Extension…**, or double-click the file.

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

In Claude Code:
```
/linkedin-optimizer:optimize_linkedin
```
Give it the path to your LinkedIn PDF export and paste 3–5 target job descriptions. It runs the full flow, pausing after each stage so you can react and request changes — exactly like working with a recruiter friend.

You can also run any stage on its own, e.g. `/linkedin-optimizer:diagnostic`.

## Customize

- **`resources/keyword_taxonomy.txt`** — the keyword list `keyword_gap` checks against. Add the terms that matter for your target roles.
- **`prompts/*.md`** — the methodology. Edit any prompt's rules to taste.

## Roadmap

- `consistency_check` tool: diff titles, dates, and metrics across LinkedIn vs resume.
- Smarter keyword extraction (n-grams + frequency) instead of a fixed taxonomy.
- A `search_visibility` heuristic that scores how a profile ranks for likely recruiter queries.

## License

MIT
