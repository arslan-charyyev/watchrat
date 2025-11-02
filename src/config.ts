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
  searchPattern: z.string(),
  searchCssSelector: z.string(),
});

export const WebsiteSchema = z.object({
  name: z.string(),
  index: z.url(),
  urlPattern: z.string(),
  searchMultiple: z.boolean(),
  ...WebsiteOptionsSchema.partial().shape,
});

export const ConfigSchema = z.object({
  telegram: TelegramSchema,
  defaultOptions: WebsiteOptionsSchema,
  websites: z.array(WebsiteSchema),
});

const rawConfig = parse(await Deno.readTextFile(env.CONFIG_PATH));
export const appConfig = ConfigSchema.parse(rawConfig);
