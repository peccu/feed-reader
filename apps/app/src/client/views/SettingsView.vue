<template>
  <div class="h-full flex flex-col bg-background relative">
    <BackButton />
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold">Settings / Feeds</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Add feed -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Feed</h2>
        <div class="flex gap-2">
          <input
            v-model="newFeedUrl"
            type="url"
            placeholder="https://example.com/feed.xml"
            class="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            @click="addFeed()"
            :disabled="!newFeedUrl"
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </section>

      <!-- Feed list -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Feeds ({{ feedsStore.feeds.length }})
        </h2>
        <div class="space-y-2">
          <div
            v-for="feed in feedsStore.feeds"
            :key="feed.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground">{{ feed.title }}</p>
              <p v-if="feed.description" class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {{ feed.description }}
              </p>
              <p class="text-xs text-muted-foreground/70 break-all mt-0.5">{{ feed.url }}</p>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground/60">
                <span>{{ feed.articleCount }} articles</span>
                <span v-if="feed.lastPolledAt">
                  fetched {{ new Date(feed.lastPolledAt).toLocaleString('en-US') }}
                </span>
                <span v-else>not fetched yet</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="feed.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-muted-foreground'"
              >{{ feed.isActive ? 'Active' : 'Inactive' }}</span>
              <button
                @click="feedsStore.deleteFeed(feed.id)"
                aria-label="Delete feed"
                class="text-muted-foreground hover:text-destructive transition-colors text-sm"
              >✕</button>
            </div>
          </div>
          <p v-if="feedsStore.feeds.length === 0" class="text-sm text-muted-foreground text-center py-4">
            No feeds registered
          </p>
        </div>
      </section>

      <!-- Preference -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Learning Preference</h2>
        <div v-if="pref" class="space-y-3 p-3 rounded-lg border border-border bg-card">
          <div class="flex items-center gap-3">
            <label class="text-xs text-muted-foreground w-28">Learning rate</label>
            <input
              v-model.number="prefRate"
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              class="w-24 px-2 py-1 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <span class="w-28">Articles seen</span>
            <span>{{ pref.articleCount }}</span>
          </div>
          <div class="flex justify-end">
            <button
              @click="savePref()"
              :disabled="savingPref"
              class="px-3 py-1 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50"
            >{{ savingPref ? '…' : 'Save' }}</button>
          </div>
        </div>
        <p v-else class="text-xs text-muted-foreground">No preference profile found</p>
      </section>

      <!-- URL ingest -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Submit URL</h2>
        <div class="flex gap-2">
          <input
            v-model="ingestUrl"
            type="url"
            placeholder="https://example.com/article"
            class="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            @click="ingestArticle()"
            :disabled="!ingestUrl || submitting"
            class="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50"
          >
            Submit
          </button>
        </div>
        <div v-if="pendingCount > 0" class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span class="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          {{ pendingCount }} job{{ pendingCount === 1 ? '' : 's' }} processing — articles will appear in queue shortly
        </div>
        <p v-if="ingestMessage" class="text-xs text-green-600 dark:text-green-400 mt-2">{{ ingestMessage }}</p>
      </section>

      <!-- Submitted URL history -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Submitted URLs ({{ submissions.length }})
        </h2>
        <div class="space-y-1.5">
          <div
            v-for="job in submissions"
            :key="job.id"
            class="p-2 rounded-lg border border-border bg-card text-xs"
          >
            <div class="flex items-center gap-2">
              <span :class="jobStatusClass(job.status)">{{ job.status }}</span>
              <span class="ml-auto text-muted-foreground/60">{{ shortTime(job.createdAt) }}</span>
            </div>
            <p class="mt-0.5 text-muted-foreground break-all">{{ jobUrl(job.payload) }}</p>
            <p v-if="job.error" class="mt-0.5 text-destructive break-all">{{ job.error }}</p>
          </div>
          <p v-if="submissions.length === 0" class="text-xs text-muted-foreground text-center py-2">
            No submitted URLs yet
          </p>
        </div>
      </section>

      <!-- Feedback by source domain -->
      <section v-if="domainFeedback.length > 0">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Feedback by source
        </h2>
        <div class="space-y-1.5">
          <div
            v-for="d in domainFeedback"
            :key="d.host"
            class="flex items-center gap-2 p-2 rounded-lg border border-border bg-card text-xs"
          >
            <span class="flex-1 truncate text-foreground">{{ d.host }}</span>
            <span class="flex items-center gap-1 text-yellow-500 tabular-nums">
              <ThumbsUp :size="12" />{{ d.like }}
            </span>
            <span class="flex items-center gap-1 text-destructive tabular-nums">
              <ThumbsDown :size="12" />{{ d.dislike }}
            </span>
            <span class="w-10 text-right text-muted-foreground tabular-nums">
              {{ Math.round((d.like / d.total) * 100) }}%
            </span>
          </div>
        </div>
        <p class="text-xs text-muted-foreground mt-1">Like rate per domain (like / total feedback).</p>
      </section>

      <!-- Tools (from the legacy reader) -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tools</h2>
        <div class="flex flex-col gap-2 text-sm">
          <a v-for="t in tools" :key="t.url" :href="t.url" target="_blank" rel="noopener"
            class="text-primary underline underline-offset-4">{{ t.label }}</a>
        </div>
      </section>

      <!-- Backup / migration -->
      <section>
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Backup</h2>
        <div class="flex flex-wrap gap-2">
          <button
            @click="exportSettings()"
            class="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
          >Export JSON</button>
          <label class="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent cursor-pointer">
            Import feeds
            <input type="file" accept="application/json,.json" class="hidden" @change="importSettings" />
          </label>
          <span v-if="importMessage" class="text-xs text-muted-foreground self-center">{{ importMessage }}</span>
        </div>
        <p class="text-xs text-muted-foreground mt-1">
          Export includes feed URLs and the preference vector. Import adds new feeds (existing URLs skipped).
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  FeedbackByDomainItem,
  IngestJobResponse,
  PendingJobResponse,
  PreferenceResponse,
  SettingsExport,
  SettingsImportResponse,
} from "@feed-reader/types";
import { ThumbsDown, ThumbsUp } from "lucide-vue-next";
import { onMounted, onUnmounted, ref } from "vue";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";
import { useFeedsStore } from "../stores/feeds.ts";

const feedsStore = useFeedsStore();

const submissions = ref<PendingJobResponse[]>([]);
const domainFeedback = ref<FeedbackByDomainItem[]>([]);
const importMessage = ref("");
const tools = [
  { label: "Feed URL Extractor (article-images)", url: "https://article-images.netlify.app/" },
  { label: "GenFeed — generate RSS from a page", url: "https://genfeed.netlify.app/" },
  { label: "Open RSS", url: "https://openrss.org/" },
];
const newFeedUrl = ref("");
const ingestUrl = ref("");
const ingestMessage = ref("");
const submitting = ref(false);
const pendingCount = ref(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const pref = ref<PreferenceResponse | null>(null);
const prefRate = ref(0.1);
const savingPref = ref(false);

onMounted(() => {
  feedsStore.fetchFeeds();
  fetchPendingCount();
  loadPref();
  loadSubmissions();
  loadDomainFeedback();
});

async function loadDomainFeedback() {
  try {
    const res = await api.get<{ items: FeedbackByDomainItem[] }>("/admin/feedback-by-domain");
    domainFeedback.value = res.items;
  } catch {
    // ignore
  }
}

async function loadSubmissions() {
  try {
    const res = await api.get<{ items: PendingJobResponse[] }>(
      "/admin/jobs?type=ingest_url&limit=20",
    );
    submissions.value = res.items;
  } catch {
    // ignore
  }
}

function jobUrl(payload: string): string {
  try {
    return (JSON.parse(payload) as { url?: string }).url ?? payload;
  } catch {
    return payload;
  }
}
function jobStatusClass(status: string): string {
  if (status === "failed") return "text-destructive";
  if (status === "done") return "text-green-600";
  if (status === "processing") return "text-yellow-500";
  return "text-muted-foreground";
}
function shortTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function exportSettings() {
  const data = await api.get<SettingsExport>("/feeds/export");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feed-reader-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importSettings(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  importMessage.value = "…";
  try {
    const parsed = JSON.parse(await file.text()) as { feeds?: unknown };
    const res = await api.post<SettingsImportResponse>("/feeds/import", {
      feeds: parsed.feeds ?? [],
    });
    importMessage.value = `Added ${res.added}, skipped ${res.skipped}`;
    await feedsStore.fetchFeeds();
  } catch (err) {
    importMessage.value = `Import failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function loadPref() {
  try {
    const res = await api.get<PreferenceResponse>("/preference");
    pref.value = res;
    prefRate.value = res.learningRate;
  } catch {
    // no profile yet
  }
}

async function savePref() {
  if (savingPref.value) return;
  savingPref.value = true;
  try {
    const res = await api.patch<PreferenceResponse>("/preference", {
      learningRate: prefRate.value,
    });
    pref.value = res;
  } finally {
    savingPref.value = false;
  }
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

async function fetchPendingCount() {
  try {
    const res = await api.get<{ count: number }>("/articles/ingest/pending");
    pendingCount.value = res.count;
    if (res.count > 0 && !pollTimer) {
      pollTimer = setInterval(async () => {
        const r = await api.get<{ count: number }>("/articles/ingest/pending");
        pendingCount.value = r.count;
        if (r.count === 0 && pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }, 5000);
    }
  } catch {
    // ignore
  }
}

async function addFeed() {
  if (!newFeedUrl.value) return;
  await feedsStore.addFeed({ url: newFeedUrl.value, title: newFeedUrl.value });
  newFeedUrl.value = "";
}

async function ingestArticle() {
  if (!ingestUrl.value || submitting.value) return;
  submitting.value = true;
  try {
    const res = await api.post<IngestJobResponse>("/articles/ingest/url", { url: ingestUrl.value });
    ingestMessage.value = `Queued (job: ${res.jobId.slice(0, 8)}…)`;
    ingestUrl.value = "";
    pendingCount.value += 1;
    fetchPendingCount();
  } finally {
    submitting.value = false;
  }
}
</script>
