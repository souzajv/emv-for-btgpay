import { chromium } from "playwright";

const STATIC_TIMEOUT = 15000;

export async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "EMV-BtgPay-Hub-Crawler/1.0 (internal training; educational)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(STATIC_TIMEOUT),
    });

    if (res.ok) {
      const html = await res.text();
      if (html.length > 500 && !html.includes("cf-browser-verification")) {
        return { html, method: "fetch" };
      }
    }
  } catch {
    /* fallback to playwright */
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: STATIC_TIMEOUT });
    const html = await page.content();
    return { html, method: "playwright" };
  } finally {
    await browser.close();
  }
}
