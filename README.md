# LinkedIn Optimizer

A one-click **Claude Desktop** extension that turns a set of expert recruiter prompts into a full LinkedIn profile optimizer. Give Claude your LinkedIn profile (a PDF or DOCX export) and a few target job descriptions, and it runs a full optimization: an honest recruiter-style diagnostic, then rewrites of your headline, About, experience bullets, Featured section, Skills, and a 4-week content plan — all copy-paste ready, with a chat to refine.

The model does the rewriting. The extension does the parts a model can't do reliably on its own: count which keywords appear across the JDs, validate character limits and banned words, and pull text out of a profile file when you point it at a path. The extension itself runs entirely on your machine — no hosting, no extra API key. (Your chat, including the profile you attach, is processed by Claude like any other conversation.)

## Why an extension (not just prompts)

The methodology is five strong prompts. The problem: most people won't hunt them down, paste them in the right order, and remember to feed in their profile and JDs first. Packaging it as a one-click extension means you install it once, then just attach your profile and go — and the deterministic checks (keyword counts, character limits, banned words) run automatically instead of being suggestions the model might skip.

## Install

1. Download `linkedin-optimizer.mcpb` from the [latest release](https://github.com/ahuja-sanchitt/claude-linkedin-optimizer/releases/latest).
2. In Claude Desktop, open **Settings → Extensions** (under the "Desktop app" section), then click **Advanced settings**. This opens the Developer page — you'll see a "Developer Tools Warning," which is expected for installing a local extension.
3. Click **Install Extension**, then select the downloaded `.mcpb` file.

*(Double-clicking the `.mcpb` may also work if your system has associated it with Claude Desktop — but it often just offers Notepad/your editor instead, so the Settings route above is the reliable one.)*

> **Heads-up:** this is an open-source community extension, not signed by a verified publisher, so Claude Desktop will warn it's "from an unidentified developer." That's expected for any independent extension — the full source is in this repo, so you can review it (or build it yourself) before installing.

**Prefer to build from source?** See [`mcpb/README.md`](mcpb/README.md), or run the helper below — it builds the bundle and reveals the `.mcpb` file, which you then install via the **Settings → Extensions** steps above:

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File scripts\install-desktop.ps1
```
```bash
# macOS / Linux
bash scripts/install-desktop.sh
```

## Use

1. Start a **new chat** so the newly installed extension is active.
2. **Attach** your profile (the paperclip / "Add files or photos") and paste 3–5 target job descriptions.
3. Just ask: *"Optimize my LinkedIn profile, be a brutally honest recruiter."* Claude uses the extension's tools automatically. (Its prompts may also surface in the `+` menu, depending on your Claude Desktop version.)

It runs the full flow, pausing after each stage so you can react and request changes — like working with a recruiter friend. You can also run any single stage (e.g. just the diagnostic).

## What's inside

**Prompts** — the methodology. Just describe what you want and Claude runs them through the extension (they may also appear in the `+` menu, depending on your Claude Desktop version):
- `diagnostic` — brutally honest recruiter gap analysis (identity / keyword / credibility / search / one-line)
- `rewrite_headline_about` — headline (3 ranked) + About (2 versions)
- `rewrite_experience` — bullets rewritten as `verb + scope + metric + impact`
- `design_featured_skills` — Featured slots, Skills, endorsement DMs
- `content_plan` — 4-week posting calendar
- `optimize_linkedin` — orchestrator that ingests your profile + JDs and runs all five in order

**Tools** (deterministic helpers the prompts lean on):
- `parse_profile(file_path)` — extract text from a `.pdf` or `.docx`. Only needed if you give a file *path*; attaching the file works without it.
- `parse_jds(text_or_path)` — accept pasted JD text or a file
- `keyword_gap(profile_text, jd_texts, min_jds)` — terms in N+ JDs missing from the profile
- `lint_headline(text, max_chars, must_include)` — length / banned-word / keyword check
- `lint_bullet(text)` — flags bullets missing a metric or opening with a weak verb

## Customize

- **`resources/keyword_taxonomy.txt`** — the keyword list `keyword_gap` checks against. Add the terms that matter for your target roles.
- **`prompts/*.md`** — the methodology. Edit any prompt's rules to taste, then rebuild the extension (`cd mcpb && npm run pack`).

## Roadmap

- `consistency_check` tool: diff titles, dates, and metrics across LinkedIn vs resume.
- Smarter keyword extraction (n-grams + frequency) instead of a fixed taxonomy.
- A `search_visibility` heuristic that scores how a profile ranks for likely recruiter queries.

## License

MIT
