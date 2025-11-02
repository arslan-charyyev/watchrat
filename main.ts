import { db } from "./src/db.ts";
import { initCronJobs } from "./src/watchrat.ts";

if (import.meta.main) {
  console.log("Watchrat starting...");

  await db.init();

  initCronJobs();
}
