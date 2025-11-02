import { DOMParser } from "@b-fuze/deno-dom";
import { appConfig, WebsiteIndexSchema } from "./config.ts";
import { db } from "./db.ts";
import { telegramBot } from "./telegram.ts";
import z from "zod";

async function visitUrl(url: string, searchPattern: string): Promise<string[]> {
  console.log(`  Visiting URL ${url}`);

  const res = await fetch(url);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "text/html");

  // Remove hidden content to avoid duplication
  for (const tag of ["script", "style", "template", "noscript"]) {
    doc.body.querySelectorAll(tag).forEach((el) => el.remove());
  }

  const renderedText = doc.body.textContent;
  const regexMatches = renderedText.matchAll(new RegExp(searchPattern, "gi"));
  const resultSet = new Set<string>();

  for (const match of regexMatches) {
    resultSet.add(match[0].trim());
  }

  return Array.from(resultSet);
}

async function checkWebsite(website: z.infer<typeof WebsiteIndexSchema>) {
  console.log(`Cron callback: ${website.name}`);
  const res = await fetch(website.index);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "text/html");

  const urlPattern = new RegExp(website.urlPattern, "i");
  const hrefs = [...doc.querySelectorAll("a")]
    .filter((a) => urlPattern.test(a.getAttribute("href") ?? ""))
    .map((a) => a.getAttribute("href") ?? "");

  for (const href of hrefs) {
    const url = href.startsWith("/")
      ? new URL(website.index).origin + href // relative link
      : href; // absolute link

    if (await db.isUrlVisited(url)) {
      continue;
    }

    const results = await visitUrl(url, website.searchPattern);

    for (const result of results) {
      telegramBot.sendMessage([website.name, url, result].join("\n\n"));
    }

    await db.saveVisitedUrl(url);
  }
}

export function initCronJobs() {
  for (const website of appConfig.websites) {
    const cron = website.cron ?? appConfig.defaultOptions.cron;

    Deno.cron(website.name, cron, () => checkWebsite(website));
    console.log(`Cron registered for: ${website.name} - ${website.index}`);

    if (website.runOnStartup ?? appConfig.defaultOptions.runOnStartup) {
      checkWebsite(website);
    }
  }
}
