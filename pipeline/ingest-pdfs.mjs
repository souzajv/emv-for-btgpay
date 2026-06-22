import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pdf from "pdf-parse";
import { slugify } from "./lib/slugify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_DIR = join(__dirname, "..", "pdfs");
const RAW_DIR = join(__dirname, "..", "content", "raw", "pdfs");

function chunkPdfText(text, title, sourceFile) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 80);

  const sections = [];
  let currentHeading = "Introdução";
  let currentBody = [];

  for (const para of paragraphs) {
    const isHeading =
      para.length < 120 &&
      (para === para.toUpperCase() || /^(\d+\.|\d+\.\d+)\s/.test(para));

    if (isHeading && currentBody.length > 0) {
      sections.push({
        anchorId: slugify(currentHeading),
        heading: currentHeading,
        bodyMd: currentBody.join("\n\n").slice(0, 6000),
      });
      currentHeading = para;
      currentBody = [];
    } else if (isHeading) {
      currentHeading = para;
    } else {
      currentBody.push(para);
      if (currentBody.join("").length > 3000) {
        sections.push({
          anchorId: slugify(currentHeading),
          heading: currentHeading,
          bodyMd: currentBody.join("\n\n").slice(0, 6000),
        });
        currentBody = [];
      }
    }
  }

  if (currentBody.length > 0) {
    sections.push({
      anchorId: slugify(currentHeading),
      heading: currentHeading,
      bodyMd: currentBody.join("\n\n").slice(0, 6000),
    });
  }

  if (sections.length === 0) {
    sections.push({
      anchorId: "conteudo-principal",
      heading: title,
      bodyMd: text.slice(0, 8000),
    });
  }

  return {
    url: `file://${sourceFile}`,
    method: "pdf-parse",
    title,
    sections,
    scrapedAt: new Date().toISOString(),
    sourceUrl: `file://${sourceFile}`,
  };
}

async function main() {
  mkdirSync(RAW_DIR, { recursive: true });

  if (!existsSync(PDF_DIR)) {
    console.log("No PDFs directory found");
    return;
  }

  const files = readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));

  for (const file of files) {
    const filePath = join(PDF_DIR, file);
    const buffer = readFileSync(filePath);
    const data = await pdf(buffer);
    const title = file.replace(/\.pdf$/, "").replace(/-/g, " ");
    const content = chunkPdfText(data.text, title, file);

    const baseName = file.replace(/\.pdf$/, "");
    writeFileSync(join(RAW_DIR, `${baseName}.json`), JSON.stringify(content, null, 2));
    console.log(`Ingested ${file}: ${content.sections.length} sections`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
