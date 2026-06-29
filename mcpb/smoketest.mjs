// Spawns the bundled server over stdio and exercises it via the MCP client SDK.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const entry = join(HERE, "build", "index.js");

const transport = new StdioClientTransport({ command: "node", args: [entry] });
const client = new Client({ name: "smoketest", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const prompts = await client.listPrompts();
console.log("PROMPTS:", prompts.prompts.map((p) => p.name).join(", "));

// lint_bullet: weak verb + no metric
const r1 = await client.callTool({ name: "lint_bullet", arguments: { text: "Responsible for the team" } });
console.log("lint_bullet(weak):", JSON.stringify(r1.content[0].text));

// lint_headline: too long + banned word
const r2 = await client.callTool({
  name: "lint_headline",
  arguments: { text: "Passionate engineer", max_chars: 10 },
});
console.log("lint_headline(bad):", JSON.stringify(r2.content[0].text));

// keyword_gap with throwaway taxonomy terms (depends on resources/keyword_taxonomy.txt)
const r3 = await client.callTool({
  name: "keyword_gap",
  arguments: { profile_text: "I write python", jd_texts: ["need kubernetes", "kubernetes and aws"], min_jds: 2 },
});
console.log("keyword_gap:", JSON.stringify(r3.content[0].text));

// prompt fetch
const p = await client.getPrompt({ name: "diagnostic", arguments: { target_companies: "FAANG" } });
console.log("diagnostic prompt chars:", p.messages[0].content.text.length, "includes FAANG:", p.messages[0].content.text.includes("FAANG"));

await client.close();
console.log("OK");
