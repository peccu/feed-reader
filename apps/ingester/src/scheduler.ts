type Job = () => Promise<void>;

interface ScheduledJob {
  name: string;
  run: Job;
  intervalMs: number;
  lastRun: number;
}

export class Scheduler {
  private jobs: ScheduledJob[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  add(name: string, run: Job, intervalMs: number): this {
    this.jobs.push({ name, run, intervalMs, lastRun: 0 });
    return this;
  }

  start(tickMs = 5_000): void {
    console.log("[scheduler] starting");
    this.timer = setInterval(() => this.tick(), tickMs);
    // Run immediately on start
    this.tick();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const now = Date.now();
    for (const job of this.jobs) {
      if (now - job.lastRun >= job.intervalMs) {
        job.lastRun = now;
        job.run().catch((err) => console.error(`[scheduler] ${job.name} error:`, err));
      }
    }
  }
}
