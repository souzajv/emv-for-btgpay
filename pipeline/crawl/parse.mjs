import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { slugify } from "../lib/slugify.mjs";

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

export function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();
  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      const absolute = new URL(href, baseUrl).href;
      if (absolute.startsWith("http")) links.add(absolute);
    } catch {
      /* skip */
    }
  });
  return [...links];
}

export function extractContent(html, url) {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, .cookie-banner, #onetrust-banner-sdk").remove();

  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Untitled";

  const main =
    $("main").html() ||
    $("article").html() ||
    $('[role="main"]').html() ||
    $(".content").html() ||
    $("body").html() ||
    "";

  const $main = cheerio.load(main);
  const sections = [];

  $main("h2, h3").each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading) return;

    let body = "";
    let sibling = $(el).next();
    while (sibling.length && !sibling.is("h2, h3")) {
      body += $.html(sibling);
      sibling = sibling.next();
    }

    const bodyMd = turndown.turndown(body || "").trim();
    if (bodyMd.length > 20) {
      sections.push({
        anchorId: slugify(heading),
        heading,
        bodyMd,
      });
    }
  });

  if (sections.length === 0) {
    const bodyMd = turndown.turndown(main).trim();
    if (bodyMd.length > 50) {
      sections.push({
        anchorId: "conteudo-principal",
        heading: title,
        bodyMd: bodyMd.slice(0, 8000),
      });
    }
  }

  return { title, sections, scrapedAt: new Date().toISOString(), sourceUrl: url };
}
