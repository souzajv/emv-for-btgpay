import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = join(__dirname, "..", "content", "chunks");
const META_DIR = join(__dirname, "..", "content", "_meta");

const RELEVANCE_ORDER = { alta: 0, media: 1, baixa: 2 };

function main() {
  if (!existsSync(CHUNKS_DIR)) {
    console.log("No chunks to filter");
    return;
  }

  const files = readdirSync(CHUNKS_DIR).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_")
  );
  let kept = 0;
  let demoted = 0;

  for (const file of files) {
    const path = join(CHUNKS_DIR, file);
    const chunk = JSON.parse(readFileSync(path, "utf-8"));

    if (chunk.btgpayRelevance === "baixa") {
      demoted++;
      continue;
    }

  if (
      chunk.category === "fundamentos" ||
      chunk.category === "contactless" ||
      chunk.category === "certificacao" ||
      chunk.category === "seguranca"
    ) {
      kept++;
    }
  }

  console.log(`Filter pass: ${kept} relevant chunks, ${demoted} low-relevance flagged`);
  mkdirSync(META_DIR, { recursive: true });
  writeFileSync(
    join(META_DIR, "filter-report.json"),
    JSON.stringify({ kept, demoted, filteredAt: new Date().toISOString() }, null, 2)
  );
}

main();
