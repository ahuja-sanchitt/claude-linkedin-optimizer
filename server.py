"""LinkedIn Optimizer MCP server.

Exposes deterministic helpers (PDF/DOCX parsing, keyword-gap analysis,
headline/bullet linting) plus five expert "recruiter" prompts, so any Claude
client can run a full LinkedIn optimization from an uploaded profile + JDs.

The model does the rewriting; this server does the parts a model can't do
reliably on its own (parsing files, counting JD keyword frequencies, validating
character limits and banned words).
"""
from __future__ import annotations

import re
from pathlib import Path

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("linkedin-optimizer")

PROMPTS_DIR = Path(__file__).parent / "prompts"
RESOURCES_DIR = Path(__file__).parent / "resources"


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Tools (deterministic)
# ---------------------------------------------------------------------------

@mcp.tool()
def parse_profile(file_path: str) -> str:
    """Extract text from a profile/resume that exists ON DISK (.pdf or .docx),
    given its file PATH.

    IMPORTANT: If the user ATTACHED or pasted their profile, you already have the
    text in the conversation -- use that directly and do NOT call this tool. An
    attached file is not exposed to this tool as a path, so calling it will fail.
    Use this tool only when you were given an actual filesystem path.
    """
    path = Path(file_path).expanduser()
    if not path.exists():
        return f"ERROR: file not found: {path}"
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        import pdfplumber
        chunks = []
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages, 1):
                chunks.append(f"===== PAGE {i} =====\n{page.extract_text() or ''}")
        return "\n".join(chunks)
    if suffix == ".docx":
        from docx import Document
        doc = Document(str(path))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return f"ERROR: unsupported file type '{suffix}'. Use .pdf or .docx."


@mcp.tool()
def parse_jds(text_or_path: str) -> str:
    """Return job-description text. Pass the pasted JD text directly if you have
    it (the common case). Only pass a path when the user gave you a path to a
    .txt/.docx/.pdf file on disk; attached files are not exposed here as paths."""
    candidate = Path(text_or_path.strip()).expanduser()
    if len(text_or_path) < 400 and candidate.exists():
        if candidate.suffix.lower() in {".pdf", ".docx"}:
            return parse_profile(str(candidate))
        return candidate.read_text(encoding="utf-8", errors="replace")
    return text_or_path


def _taxonomy() -> list[str]:
    f = RESOURCES_DIR / "keyword_taxonomy.txt"
    if not f.exists():
        return []
    return [ln.strip() for ln in f.read_text(encoding="utf-8").splitlines()
            if ln.strip() and not ln.startswith("#")]


@mcp.tool()
def keyword_gap(profile_text: str, jd_texts: list[str], min_jds: int = 2) -> str:
    """Find skill/role keywords that appear in at least `min_jds` of the job
    descriptions but are MISSING from the profile. Returns a ranked report."""
    prof = profile_text.lower()
    hits = []
    for kw in _taxonomy():
        k = kw.lower()
        count = sum(1 for jd in jd_texts if k in jd.lower())
        if count >= min_jds and k not in prof:
            hits.append((count, kw))
    hits.sort(reverse=True)
    if not hits:
        return "No missing keywords found above threshold."
    lines = [f"Keywords in >= {min_jds} JDs but MISSING from the profile:"]
    lines += [f"  [{c} JDs] {kw}" for c, kw in hits]
    return "\n".join(lines)


BANNED_HEADLINE = {"passionate", "results-driven", "transformational",
                   "dynamic", "seasoned", "strategic"}


@mcp.tool()
def lint_headline(text: str, max_chars: int = 120,
                  must_include: list[str] | None = None) -> str:
    """Validate a LinkedIn headline: length, banned buzzwords, required keywords."""
    issues = []
    n = len(text)
    if n > max_chars:
        issues.append(f"Too long: {n}/{max_chars} chars.")
    found = [w for w in BANNED_HEADLINE if re.search(rf"\b{re.escape(w)}\b", text, re.I)]
    if found:
        issues.append(f"Banned words: {', '.join(found)}.")
    for kw in (must_include or []):
        if kw.lower() not in text.lower():
            issues.append(f"Missing required keyword: '{kw}'.")
    return f"OK ({n}/{max_chars} chars)." if not issues else "\n".join(issues)


@mcp.tool()
def lint_bullet(text: str) -> str:
    """Check an experience bullet has a number (metric) and a strong opening verb."""
    issues = []
    if not re.search(r"\d", text):
        issues.append("No number/metric -> add a %, count, time, or scale, "
                      "or mark [METRIC NEEDED].")
    words = text.lstrip("•-* ").split()
    weak = {"responsible", "worked", "helped", "involved", "assisted"}
    if words and words[0].lower() in weak:
        issues.append(f"Weak opening verb: '{words[0]}'.")
    return "OK." if not issues else "\n".join(issues)


# ---------------------------------------------------------------------------
# Prompts (the five expert "recruiter" prompts)
# ---------------------------------------------------------------------------

@mcp.prompt()
def diagnostic(target_companies: str = "Stripe, OpenAI, Anthropic") -> str:
    """Brutally honest recruiter diagnostic of the profile vs the JDs."""
    return _load_prompt("diagnostic").replace("{{TARGET_COMPANIES}}", target_companies)


@mcp.prompt()
def rewrite_headline_about() -> str:
    """Rewrite the headline (3 ranked versions) and About section (2 versions)."""
    return _load_prompt("rewrite_headline_about")


@mcp.prompt()
def rewrite_experience() -> str:
    """Rewrite each role's bullets as verb + scope + metric + impact."""
    return _load_prompt("rewrite_experience")


@mcp.prompt()
def design_featured_skills() -> str:
    """Design the Featured section, Skills, and endorsement asks."""
    return _load_prompt("design_featured_skills")


@mcp.prompt()
def content_plan() -> str:
    """Generate a 4-week LinkedIn content plan to build authority before outreach."""
    return _load_prompt("content_plan")


@mcp.prompt()
def optimize_linkedin(profile_path: str, jds: str,
                      target_companies: str = "Stripe, OpenAI, Anthropic") -> str:
    """One-shot orchestrator: parse the profile + JDs, then run all five stages."""
    stages = "\n\n---\n\n".join(
        _load_prompt(n) for n in
        ["diagnostic", "rewrite_headline_about", "rewrite_experience",
         "design_featured_skills", "content_plan"]
    ).replace("{{TARGET_COMPANIES}}", target_companies)
    return (
        "You are my friend and a brutally honest senior tech recruiter, optimizing "
        "my LinkedIn profile end to end. Quote my real lines back to me.\n\n"
        "STEP 1 - Get my profile text. If I attached or pasted it, use that text "
        f"directly. ONLY if I gave you a filesystem path (`{profile_path}`) should "
        "you call `parse_profile` with it.\n"
        "STEP 2 - Get the JD text the same way: use what I pasted/attached directly; "
        f"call `parse_jds` only for a path to a JD file.\n{jds}\n\n"
        "STEP 3 - Work through the five stages below IN ORDER. Pause after each "
        "stage so I can react and request changes before you continue.\n\n"
        f"{stages}"
    )


if __name__ == "__main__":
    mcp.run(transport="stdio")
