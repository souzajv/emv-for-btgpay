import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { slugify } from "./lib/slugify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "..", "content", "raw");
const CHUNKS_DIR = join(__dirname, "..", "content", "chunks");

const CATEGORY_MAP = {
  payfelix: "certificacao",
  stripe: "fundamentos",
  emvco: "certificacao",
  pdfs: "seguranca",
};

function inferCategory(domain, title) {
  const base = CATEGORY_MAP[domain] || "fundamentos";
  const t = title.toLowerCase();
  if (t.includes("mobile") || t.includes("tap")) return "contactless";
  if (t.includes("security") || t.includes("terminal")) return "seguranca";
  if (t.includes("certif") || t.includes("level")) return "certificacao";
  if (t.includes("not-present") || t.includes("cnp")) return "fundamentos";
  return base;
}

function inferRelevance(category, title) {
  const t = title.toLowerCase();
  if (category === "contactless" || t.includes("mobile") || t.includes("terminal")) return "alta";
  if (category === "certificacao") return "alta";
  if (t.includes("issuer") && !t.includes("terminal")) return "media";
  return "media";
}

function walkJsonFiles(dir, domain) {
  const results = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(full, entry.name));
    } else if (entry.name.endsWith(".json") && entry.name !== "_manifest.json") {
      results.push({ path: full, domain });
    }
  }
  return results;
}

function main() {
  mkdirSync(CHUNKS_DIR, { recursive: true });

  const domains = existsSync(RAW_DIR) ? readdirSync(RAW_DIR, { withFileTypes: true }) : [];
  let count = 0;

  for (const entry of domains) {
    if (!entry.isDirectory()) continue;
    const domain = entry.name;
    const files = walkJsonFiles(join(RAW_DIR, domain), domain);

    for (const { path } of files) {
      try {
        const raw = JSON.parse(readFileSync(path, "utf-8"));
        if (!raw.sections || raw.sections.length === 0) continue;

        const title = raw.title || "Untitled";
        const id = slugify(`${domain}-${title}`).slice(0, 60) || `chunk-${count}`;
        const category = inferCategory(domain, title);

        const chunk = {
          id,
          sourceUrl: raw.sourceUrl || raw.url || "",
          sourceType: domain === "pdfs" ? "pdf" : "web",
          category,
          title,
          sections: raw.sections,
          btgpayRelevance: inferRelevance(category, title),
          scrapedAt: raw.scrapedAt || new Date().toISOString(),
        };

        writeFileSync(join(CHUNKS_DIR, `${id}.json`), JSON.stringify(chunk, null, 2));
        count++;
      } catch (err) {
        console.warn(`Skip ${path}:`, err.message);
      }
    }
  }

  console.log(`Normalized ${count} chunks to ${CHUNKS_DIR}`);
}

main();
