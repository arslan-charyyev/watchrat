import { JSDOM } from "jsdom";
import z from "zod";
import { appConfig, WebsiteSchema } from "./config.ts";
import { db } from "./db.ts";
import { telegramBot } from "./telegram.ts";
import retry from "p-retry";

async function visitUrl(
  url: string,
  website: z.infer<typeof WebsiteSchema>
): Promise<string[]> {
  console.log(`  Visiting URL ${url}`);

  const searchRoot = await retry(
    async () => {
      const res = await fetch(url);
      const text = await res.text();
      const dom = new JSDOM(text);
      const doc = dom.window.document;
      const cssSelector =
        website.searchCssSelector ?? appConfig.defaultOptions.searchCssSelector;
      const searchRoot = doc.querySelector(cssSelector);
      if (searchRoot) {
        return searchRoot;
      } else {
        throw new Error(`CSS selector "${cssSelector}" not found in ${url}`);
      }
    },
    { retries: 3 }
  );

  // Remove hidden content to avoid duplication
  for (const tag of ["script", "style", "template", "noscript"]) {
    searchRoot.querySelectorAll(tag).forEach((el) => el.remove());
  }

  const renderedText = searchRoot.textContent;
  const searchPattern =
    website.searchPattern ?? appConfig.defaultOptions.searchPattern;
  const searchRegex = new RegExp(searchPattern, "gi");

  if (website.searchMultiple) {
    const regexMatches = renderedText.matchAll(searchRegex);
    const resultSet = new Set<string>();

    for (const match of regexMatches) {
      resultSet.add(match[0].trim());
    }

    return Array.from(resultSet);
  } else {
    const match = renderedText.match(searchRegex);
    if (match) {
      return [match[0].trim()];
    } else {
      return [];
    }
  }
}

async function checkWebsite(website: z.infer<typeof WebsiteSchema>) {
  try {
    console.log(`Checking website: ${website.name} - ${website.index}`);
    const res = await fetch(website.index);
    const text = await res.text();
    const dom = new JSDOM(text);
    const doc = dom.window.document;

    const urlPattern = new RegExp(website.urlPattern, "i");
    const hrefs = [...doc.querySelectorAll("a")]
      .filter((a) => urlPattern.test(a.getAttribute("href") ?? ""))
      .map((a) => a.getAttribute("href") ?? "");

    for (const href of hrefs) {
      const url = href.startsWith("/")
        ? new URL(website.index).origin + href // relative link
        : href; // absolute link

      if (await db.isUrlVisited(url)) {
        console.log(`Skipping visited URL: ${url}`);
        continue;
      }

      try {
        const results = await visitUrl(url, website);

        for (const result of results) {
          telegramBot.sendMessage([website.name, url, result].join("\n\n"));
        }

        await db.saveVisitedUrl(url);
      } catch (e) {
        console.error("Error visiting URL", e);
      }
    }
  } catch (e) {
    console.error("Error checking website", e);
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
