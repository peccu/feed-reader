<template>
  <div class="h-full flex flex-col bg-background">
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <RouterLink to="/" class="text-muted-foreground hover:text-foreground text-xl">←</RouterLink>
      <h1 class="text-base font-semibold flex-1">Admin / Status</h1>
      <button @click="load" class="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground">
        Refresh
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Stats -->
      <section v-if="stats">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Database</h2>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="s in topStats" :key="s.label" class="p-3 rounded-lg border border-border bg-card">
            <p class="text-2xl font-bold tabular-nums text-foreground">{{ s.value }}</p>
            <p class="text-xs text-muted-foreground">{{ s.label }}</p>
          </div>
        </div>
      </section>

      <!-- Queue breakdown -->
      <section v-if="stats">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Queue</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(v, k) in stats.queue"
            :key="k"
            class="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
          >{{ k }}: <span class="font-semibold tabular-nums">{{ v }}</span></span>
        </div>
      </section>

      <!-- Pending jobs breakdown -->
      <section v-if="stats">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ingest jobs</h2>
        <div class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="(v, k) in stats.pendingJobs"
            :key="k"
            :class="[
              'px-2.5 py-1 rounded-full text-xs',
              k === 'failed' && v > 0 ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-secondary-foreground',
            ]"
          >{{ k }}: <span class="font-semibold tabular-nums">{{ v }}</span></span>
        </div>
      </section>

      <!-- Recent jobs (what happened to submitted URLs) -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent jobs</h2>
        <div class="space-y-2">
          <div
            v-for="job in jobs"
            :key="job.id"
            class="p-2.5 rounded-lg border border-border bg-card text-xs"
          >
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{{ job.jobType }}</span>
              <span :class="statusClass(job.status)">{{ job.status }}</span>
              <span class="ml-auto text-muted-foreground/60">{{ formatTime(job.createdAt) }}</span>
            </div>
            <p class="mt-1 text-muted-foreground break-all">{{ jobSummary(job.payload) }}</p>
            <p v-if="job.error" class="mt-1 text-destructive break-all">{{ job.error }}</p>
          </div>
          <p v-if="jobs.length === 0" class="text-sm text-muted-foreground text-center py-4">No jobs yet</p>
        </div>
      </section>

      <RouterLink
        to="/library"
        class="block text-center text-sm text-primary underline underline-offset-4"
      >View articles &amp; scores in Library →</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminStatsResponse, PendingJobResponse } from "@feed-reader/types";
import { computed, onMounted, ref } from "vue";
import { api } from "../api/client.ts";

const stats = ref<AdminStatsResponse | null>(null);
const jobs = ref<PendingJobResponse[]>([]);

const topStats = computed(() =>
  stats.value
    ? [
        { label: "Articles", value: stats.value.articles },
        { label: "Feeds", value: stats.value.feeds },
        { label: "Notes", value: stats.value.notes },
        { label: "Categories", value: stats.value.categories },
      ]
    : [],
);

async function load() {
  const [s, j] = await Promise.all([
    api.get<AdminStatsResponse>("/admin/stats"),
    api.get<{ items: PendingJobResponse[] }>("/admin/jobs"),
  ]);
  stats.value = s;
  jobs.value = j.items;
}

function statusClass(status: string): string {
  if (status === "failed") return "text-destructive";
  if (status === "done") return "text-green-600";
  if (status === "processing") return "text-yellow-500";
  return "text-muted-foreground";
}

function jobSummary(payload: string): string {
  try {
    const p = JSON.parse(payload) as { url?: string; articleId?: string };
    return p.url ?? p.articleId ?? payload;
  } catch {
    return payload;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(load);
</script>
