import { parse } from "@std/yaml";

import { z } from "zod";
import { env } from "./env.ts";

export const TelegramSchema = z.object({
  botToken: z.string(),
  recipientId: z.number(),
});

export const WebsiteOptionsSchema = z.object({
  cron: z.string(),
  runOnStartup: z.boolean(),
});

export const WebsiteBaseSchema = z.object({
  ...WebsiteOptionsSchema.partial().shape,
  name: z.string(),
});

// const WebsitePageSchema = WebsiteBaseSchema.extend({
//   url: z.url(),
// });

export const WebsiteIndexSchema = WebsiteBaseSchema.extend({
  index: z.url(),
  urlPattern: z.string(),
  searchPattern: z.string(),
});

// const WebsiteSchema = z.discriminatedUnion("index", [
//   WebsitePageSchema,
//   WebsiteIndexSchema,
// ]);

export const ConfigSchema = z.object({
  telegram: TelegramSchema,
  defaultOptions: WebsiteOptionsSchema,
  websites: z.array(WebsiteIndexSchema /* WebsiteSchema */),
});

const rawConfig = parse(await Deno.readTextFile(env.CONFIG_PATH));
export const appConfig = ConfigSchema.parse(rawConfig);
