// Load .env into the process (reads .env in cwd)
import "@std/dotenv/load";

import { z } from "zod";

const EnvSchema = z.object({
  CONFIG_PATH: z.string().default("config.yml"),
  DB_PATH: z.string().default("db.sqlite3"),
});

export const env = await EnvSchema.parseAsync(Deno.env.toObject());
