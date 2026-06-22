import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pLimit from "p-limit";
import robotsParser from "robots-parser";
import { SEED_URLS, RATE_LIMIT_MS, USER_AGENT } from "./config.mjs";
import { fetchPage } from "./fetch.mjs";
import { extractLinks, extractContent } from "./parse.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const RAW_DIR = join(ROOT, "content", "raw");
const MANIFEST_PATH = join(RAW_DIR, "_manifest.json");

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    if (u.pathname.endsWith("/") && u.pathname.length > 1) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return null;
  }
}

function urlToFilename(url) {
  const u = new URL(url);
  const safe = u.hostname + u.pathname.replace(/\//g, "_").replace(/^_/, "");
  return safe.slice(0, 200) || "index";
}

async function canFetch(robots, url) {
  if (!robots) return true;
  try {
    return robots.isAllowed(url, USER_AGENT) !== false;
  } catch {
    return true;
  }
}

async function crawlDomain(config) {
  const visited = new Set();
  const queue = [...config.seeds.map(normalizeUrl).filter(Boolean)];
  const results = { success: [], failed: [] };
  let robots = null;

  try {
    const robotsUrl = `https://${config.domain}/robots.txt`;
    const robotsRes = await fetch(robotsUrl, { headers: { "User-Agent": USER_AGENT } });
    if (robotsRes.ok) {
      robots = robotsParser(robotsUrl, await robotsRes.text());
    }
  } catch {
    /* ignore */
  }

  while (queue.length > 0 && visited.size < config.maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;

    const parsed = new URL(url);
    if (parsed.hostname !== config.domain && !parsed.hostname.endsWith(`.${config.domain}`)) {
      continue;
    }

    if (config.pathPrefix && !parsed.pathname.startsWith(config.pathPrefix)) {
      continue;
    }

    if (!(await canFetch(robots, url))) {
      results.failed.push({ url, error: "robots.txt disallowed" });
      continue;
    }

    visited.add(url);
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));

    try {
      const { html, method } = await fetchPage(url);
      const content = extractContent(html, url);
      const filename = urlToFilename(url);
      const outDir = join(RAW_DIR, config.domain);
      mkdirSync(outDir, { recursive: true });

      writeFileSync(join(outDir, `${filename}.html`), html, "utf-8");
      writeFileSync(
        join(outDir, `${filename}.json`),
        JSON.stringify({ url, method, ...content }, null, 2),
        "utf-8"
      );

      results.success.push({ url, method, title: content.title });

      const links = extractLinks(html, url);
      for (const link of links) {
        const normalized = normalizeUrl(link);
        if (normalized && !visited.has(normalized) && !queue.includes(normalized)) {
          const linkHost = new URL(normalized).hostname;
          if (linkHost === config.domain || linkHost.endsWith(`.${config.domain}`)) {
            if (!config.pathPrefix || new URL(normalized).pathname.startsWith(config.pathPrefix)) {
              queue.push(normalized);
            }
          }
        }
      }
    } catch (err) {
      results.failed.push({ url, error: String(err.message || err) });
    }
  }

  return results;
}

async function main() {
  mkdirSync(RAW_DIR, { recursive: true });

  const manifest = existsSync(MANIFEST_PATH)
    ? JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"))
    : { runs: [] };

  const run = { startedAt: new Date().toISOString(), domains: {} };
  const limit = pLimit(1);

  for (const config of SEED_URLS) {
    console.log(`Crawling ${config.domain}...`);
    run.domains[config.domain] = await limit(() => crawlDomain(config));
    const { success, failed } = run.domains[config.domain];
    console.log(`  ${success.length} ok, ${failed.length} failed`);
  }

  run.finishedAt = new Date().toISOString();
  manifest.runs.push(run);
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Manifest written to ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
