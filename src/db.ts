import { memoize } from "@std/cache";
import * as path from "@std/path";
import { env } from "./env.ts";

const getKV = memoize(async () => {
  const dbPath = path.resolve(env.DB_PATH);
  const dbDir = path.dirname(dbPath);
  await Deno.mkdir(dbDir, { recursive: true });
  return await Deno.openKv(env.DB_PATH);
});

async function init() {
  await getKV();
}

async function isUrlVisited(url: string) {
  const kv = await getKV();
  const res = await kv.get(["visited", url]);
  return !!res.versionstamp;
}

async function saveVisitedUrl(url: string) {
  const kv = await getKV();
  return await kv.set(["visited", url], new Date());
}

export const db = {
  init,
  isUrlVisited,
  saveVisitedUrl,
};
