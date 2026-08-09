import { runPendingJobRunner } from "./jobs/PendingJobRunner.ts";
import { runPreferenceUpdateJob } from "./jobs/PreferenceUpdateJob.ts";
import { runRSSPollJob } from "./jobs/RSSPollJob.ts";
import { Scheduler } from "./scheduler.ts";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

const pendingIntervalMs = Number(process.env.PENDING_JOB_CHECK_INTERVAL_SECONDS ?? 30) * SECOND;
const rssIntervalMs = Number(process.env.RSS_POLL_INTERVAL_MINUTES ?? 60) * MINUTE;
const preferenceIntervalMs = Number(process.env.PREFERENCE_DEBOUNCE_MINUTES ?? 5) * MINUTE;

console.log("[ingester] starting");

const scheduler = new Scheduler()
  .add("pending-jobs", runPendingJobRunner, pendingIntervalMs)
  .add("rss-poll", runRSSPollJob, rssIntervalMs)
  .add("preference-update", runPreferenceUpdateJob, preferenceIntervalMs);

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
