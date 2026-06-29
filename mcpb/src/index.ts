/**
 * LinkedIn Optimizer MCP server (Node/TypeScript port).
 *
 * Packaged as a one-click Claude Desktop extension (.mcpb). Exposes deterministic
 * helpers (PDF/DOCX parsing, keyword-gap analysis, headline/bullet linting) plus
 * the five expert "recruiter" prompts, so Claude Desktop can run a full LinkedIn
 * optimization from a profile sitting on the user's local disk + target JDs.
 *
 * The model does the rewriting; this server does only the parts a model can't do
 * reliably on its own (parsing files, counting JD keyword frequencies, validating
 * character limits and banned words).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// unpdf ships a modern, serverless build of Mozilla's pdf.js — robust on real-world
// PDFs (LinkedIn exports) and bundles cleanly, unlike pdf-parse's 2016-era pdf.js.
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(HERE, "prompts");
const RESOURCES_DIR = join(HERE, "resources");

function loadPrompt(name: string): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.md`), "utf-8");
}

/** Expand a leading ~ to the user's home directory (parity with Path.expanduser). */
function expanduser(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return join(homedir(), p.slice(2));
  return p;
}

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

const server = new McpServer({ name: "linkedin-optimizer", version: "0.1.0" });

// ---------------------------------------------------------------------------
// Tools (deterministic)
// ---------------------------------------------------------------------------

async function extractFile(path: string): Promise<string> {
  const suffix = extname(path).toLowerCase();
  if (suffix === ".pdf") {
    const buf = new Uint8Array(readFileSync(path));
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  if (suffix === ".docx") {
    const { value } = await mammoth.extractRawText({ path });
    return value
      .split("\n")
      .filter((line) => line.trim())
      .join("\n");
  }
  return `ERROR: unsupported file type '${suffix}'. Use .pdf or .docx.`;
}

server.tool(
  "parse_profile",
  "Extract text from a LinkedIn profile export or resume (.pdf or .docx). " +
    "Pass the absolute path to the file the user uploaded. Returns the raw text " +
    "so the model can structure it.",
  { file_path: z.string().describe("Absolute path to a .pdf or .docx file") },
  async ({ file_path }) => {
    const path = expanduser(file_path);
    if (!existsSync(path)) return text(`ERROR: file not found: ${path}`);
    try {
      return text(await extractFile(path));
    } catch (err) {
      return text(`ERROR: could not read '${path}': ${(err as Error).message}`);
    }
  }
);

server.tool(
  "parse_jds",
  "Return job-description text. Accepts raw pasted text, or a path to a " +
    ".txt/.docx/.pdf file containing one or more job descriptions.",
  { text_or_path: z.string().describe("Pasted JD text, or a path to a JD file") },
  async ({ text_or_path }) => {
    const candidate = expanduser(text_or_path.trim());
    if (text_or_path.length < 400 && existsSync(candidate)) {
      const suffix = extname(candidate).toLowerCase();
      if (suffix === ".pdf" || suffix === ".docx") {
        return text(await extractFile(candidate));
      }
      return text(readFileSync(candidate, "utf-8"));
    }
    return text(text_or_path);
  }
);

function taxonomy(): string[] {
  const f = join(RESOURCES_DIR, "keyword_taxonomy.txt");
  if (!existsSync(f)) return [];
  return readFileSync(f, "utf-8")
    .split(/\r?\n/)
    .map((ln) => ln.trim())
    .filter((ln) => ln && !ln.startsWith("#"));
}

server.tool(
  "keyword_gap",
  "Find skill/role keywords that appear in at least `min_jds` of the job " +
    "descriptions but are MISSING from the profile. Returns a ranked report.",
  {
    profile_text: z.string().describe("Full profile text"),
    jd_texts: z.array(z.string()).describe("One string per job description"),
    min_jds: z.number().int().default(2).describe("Threshold of JDs a term must appear in"),
  },
  async ({ profile_text, jd_texts, min_jds }) => {
    const prof = profile_text.toLowerCase();
    const hits: Array<[number, string]> = [];
    for (const kw of taxonomy()) {
      const k = kw.toLowerCase();
      const count = jd_texts.filter((jd) => jd.toLowerCase().includes(k)).length;
      if (count >= min_jds && !prof.includes(k)) hits.push([count, kw]);
    }
    hits.sort((a, b) => b[0] - a[0] || b[1].localeCompare(a[1]));
    if (hits.length === 0) return text("No missing keywords found above threshold.");
    const lines = [`Keywords in >= ${min_jds} JDs but MISSING from the profile:`];
    for (const [c, kw] of hits) lines.push(`  [${c} JDs] ${kw}`);
    return text(lines.join("\n"));
  }
);

const BANNED_HEADLINE = [
  "passionate",
  "results-driven",
  "transformational",
  "dynamic",
  "seasoned",
  "strategic",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

server.tool(
  "lint_headline",
  "Validate a LinkedIn headline: length, banned buzzwords, required keywords.",
  {
    text: z.string().describe("The headline to validate"),
    max_chars: z.number().int().default(120).describe("Max allowed characters"),
    must_include: z
      .array(z.string())
      .optional()
      .describe("Keywords the headline must contain"),
  },
  async ({ text: headline, max_chars, must_include }) => {
    const issues: string[] = [];
    const n = headline.length;
    if (n > max_chars) issues.push(`Too long: ${n}/${max_chars} chars.`);
    const found = BANNED_HEADLINE.filter((w) =>
      new RegExp(`\\b${escapeRe(w)}\\b`, "i").test(headline)
    );
    if (found.length) issues.push(`Banned words: ${found.join(", ")}.`);
    for (const kw of must_include ?? []) {
      if (!headline.toLowerCase().includes(kw.toLowerCase()))
        issues.push(`Missing required keyword: '${kw}'.`);
    }
    return text(issues.length === 0 ? `OK (${n}/${max_chars} chars).` : issues.join("\n"));
  }
);

const WEAK_VERBS = ["responsible", "worked", "helped", "involved", "assisted"];

server.tool(
  "lint_bullet",
  "Check an experience bullet has a number (metric) and a strong opening verb.",
  { text: z.string().describe("A single experience bullet") },
  async ({ text: bullet }) => {
    const issues: string[] = [];
    if (!/\d/.test(bullet)) {
      issues.push(
        "No number/metric -> add a %, count, time, or scale, or mark [METRIC NEEDED]."
      );
    }
    const words = bullet.replace(/^[•\-* ]+/, "").split(/\s+/).filter(Boolean);
    if (words.length && WEAK_VERBS.includes(words[0].toLowerCase())) {
      issues.push(`Weak opening verb: '${words[0]}'.`);
    }
    return text(issues.length === 0 ? "OK." : issues.join("\n"));
  }
);

// ---------------------------------------------------------------------------
// Prompts (the five expert "recruiter" prompts)
// ---------------------------------------------------------------------------

function userMessage(body: string) {
  return { messages: [{ role: "user" as const, content: { type: "text" as const, text: body } }] };
}

server.prompt(
  "diagnostic",
  "Brutally honest recruiter diagnostic of the profile vs the JDs.",
  { target_companies: z.string().optional() },
  ({ target_companies }) =>
    userMessage(
      loadPrompt("diagnostic").replaceAll(
        "{{TARGET_COMPANIES}}",
        target_companies || "top-tier tech companies"
      )
    )
);

server.prompt(
  "rewrite_headline_about",
  "Rewrite the headline (3 ranked versions) and About section (2 versions).",
  () => userMessage(loadPrompt("rewrite_headline_about"))
);

server.prompt(
  "rewrite_experience",
  "Rewrite each role's bullets as verb + scope + metric + impact.",
  () => userMessage(loadPrompt("rewrite_experience"))
);

server.prompt(
  "design_featured_skills",
  "Design the Featured section, Skills, and endorsement asks.",
  () => userMessage(loadPrompt("design_featured_skills"))
);

server.prompt(
  "content_plan",
  "Generate a 4-week LinkedIn content plan to build authority before outreach.",
  () => userMessage(loadPrompt("content_plan"))
);

server.prompt(
  "optimize_linkedin",
  "One-shot orchestrator: parse the profile + JDs, then run all five stages.",
  {
    profile_path: z.string().describe("Absolute path to the LinkedIn PDF/DOCX export"),
    jds: z.string().describe("Pasted job descriptions (or a path to a JD file)"),
    target_companies: z.string().optional(),
  },
  ({ profile_path, jds, target_companies }) => {
    const stages = ["diagnostic", "rewrite_headline_about", "rewrite_experience", "design_featured_skills", "content_plan"]
      .map((n) => loadPrompt(n))
      .join("\n\n---\n\n")
      .replaceAll("{{TARGET_COMPANIES}}", target_companies || "top-tier tech companies");
    return userMessage(
      "You are optimizing a LinkedIn profile end to end. Be a brutally honest " +
        "senior tech recruiter; quote the user's real lines back to them.\n\n" +
        `STEP 1 - Call the \`parse_profile\` tool with file_path = \`${profile_path}\`.\n` +
        `STEP 2 - Call \`parse_jds\` with these job descriptions:\n${jds}\n\n` +
        "STEP 3 - Work through the five stages below IN ORDER. Pause after each " +
        "stage so the user can react and request changes before you continue.\n\n" +
        stages
    );
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
