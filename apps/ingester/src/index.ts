import { runPendingJobRunner } from "./jobs/PendingJobRunner.ts";
import { runPreferenceUpdateJob } from "./jobs/PreferenceUpdateJob.ts";
import { runRSSPollJob } from "./jobs/RSSPollJob.ts";
import { Scheduler } from "./scheduler.ts";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

console.log("[ingester] starting");

const scheduler = new Scheduler()
  .add("pending-jobs", runPendingJobRunner, 30 * SECOND)
  .add("rss-poll", runRSSPollJob, HOUR)
  .add("preference-update", runPreferenceUpdateJob, 5 * MINUTE);

scheduler.start(5 * SECOND);

process.on("SIGTERM", () => {
  console.log("[ingester] SIGTERM received, stopping");
  scheduler.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[ingester] SIGINT received, stopping");
  scheduler.stop();
  process.exit(0);
});
