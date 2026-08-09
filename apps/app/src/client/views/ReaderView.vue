<template>
  <div class="h-full flex flex-col bg-background">
    <!-- Header -->
    <div
      class="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <button @click="router.back()" class="text-muted-foreground hover:text-foreground text-xl leading-none">←</button>
      <span class="flex-1 truncate text-sm font-medium text-foreground">{{ article?.title ?? "Loading..." }}</span>
      <a
        v-if="article"
        :href="article.url"
        target="_blank"
        rel="noopener"
        class="text-muted-foreground hover:text-foreground text-sm"
      >↗</a>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="article">
        <!-- Lead / eyecatch image (full-bleed) -->
        <img
          v-if="article.leadImageUrl"
          :src="article.leadImageUrl"
          alt=""
          class="w-full max-h-80 object-cover bg-secondary"
          loading="lazy"
          @error="onImageError"
        />

        <div class="px-4 py-4">
          <!-- Meta -->
          <div class="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
            <span v-if="article.author" class="font-medium">{{ article.author }}</span>
            <span v-if="article.publishedAt">{{ formattedDate }}</span>
            <span v-if="article.wordCount">{{ article.wordCount.toLocaleString() }} words</span>
          </div>

          <!-- Title -->
          <h1 class="text-2xl font-bold leading-tight mb-4 text-foreground">{{ article.title }}</h1>

          <!-- Summary -->
          <blockquote v-if="article.summary" class="border-l-2 border-primary pl-4 mb-6 text-sm text-muted-foreground italic">
            {{ article.summary }}
          </blockquote>

          <!-- Rich HTML body -->
          <div
            v-if="article.html"
            class="article-html text-sm leading-relaxed text-foreground"
            v-html="renderedHtml"
          />

          <!-- Plain-text fallback -->
          <div
            v-else-if="article.fullText"
            class="text-sm leading-relaxed text-foreground whitespace-pre-wrap"
          >{{ article.fullText }}</div>

          <div v-else class="text-center py-8 text-muted-foreground">
            <a :href="article.url" target="_blank" rel="noopener" class="text-primary underline underline-offset-4">
              Open original article ↗
            </a>
          </div>
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    </div>

    <!-- Action bar -->
    <div
      class="flex items-center justify-around px-4 py-3 border-t border-border bg-background shrink-0"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <button
        @click="sendFeedback('dislike')"
        :class="[
          'flex flex-col items-center gap-1 transition-colors px-3 py-1 rounded-lg',
          evaluation === 'dislike' ? 'text-destructive' : 'text-muted-foreground hover:text-destructive',
        ]"
      >
        <ThumbsDown :size="22" />
        <span class="text-[11px]">Dislike</span>
      </button>

      <button
        @click="sendFeedback('like')"
        :class="[
          'flex flex-col items-center gap-1 transition-colors px-3 py-1 rounded-lg',
          evaluation === 'like' ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500',
        ]"
      >
        <ThumbsUp :size="22" />
        <span class="text-[11px]">Like</span>
      </button>

      <button
        @click="markRead()"
        class="flex flex-col items-center gap-1 text-muted-foreground hover:text-green-600 transition-colors px-3 py-1 rounded-lg"
      >
        <Check :size="22" />
        <span class="text-[11px]">Read</span>
      </button>

      <button
        @click="showNoteForm = !showNoteForm"
        class="flex flex-col items-center gap-1 text-primary px-3 py-1 rounded-lg"
      >
        <StickyNote :size="22" />
        <span class="text-[11px] font-medium">Note</span>
      </button>

      <RouterLink
        to="/"
        class="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-lg"
      >
        <LayoutList :size="22" />
        <span class="text-[11px]">Queue</span>
      </RouterLink>
    </div>

    <!-- Note form overlay -->
    <div
      v-if="showNoteForm"
      class="absolute inset-0 bg-background/95 flex flex-col z-50"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div class="flex items-center px-4 py-3 border-b border-border">
        <button @click="showNoteForm = false" class="text-muted-foreground hover:text-foreground">✕</button>
        <span class="flex-1 text-center font-medium text-sm">Add note</span>
        <button @click="saveNote()" class="text-primary text-sm font-medium">Save</button>
      </div>
      <textarea
        v-model="noteContent"
        class="flex-1 p-4 resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        placeholder="Write a note about this article..."
        autofocus
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDetailResponse, CreateNoteRequest, NoteResponse } from "@feed-reader/types";
import { Check, LayoutList, StickyNote, ThumbsDown, ThumbsUp } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/client.ts";
import { sanitizeHtml } from "../lib/sanitize.ts";
import { useFeedbackStore } from "../stores/feedback.ts";
import { useQueueStore } from "../stores/queue.ts";

const route = useRoute();
const router = useRouter();
const queue = useQueueStore();
const feedback = useFeedbackStore();

const articleId = computed(() => route.params.id as string);
const article = ref<ArticleDetailResponse | null>(null);
const showNoteForm = ref(route.query.note === "1");
const noteContent = ref("");

const evaluation = ref<"like" | "dislike" | null>(null);
const renderedHtml = computed(() => (article.value?.html ? sanitizeHtml(article.value.html) : ""));

function onImageError(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}

const formattedDate = computed(() => {
  const date = article.value?.publishedAt;
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

onMounted(async () => {
  article.value = await queue.fetchArticle(articleId.value);
});

// Evaluation only — updates the preference vector, does not mark read/navigate.
async function sendFeedback(type: "like" | "dislike") {
  evaluation.value = type;
  await feedback.sendFeedback(articleId.value, type);
}

// Finished reading → mark read and leave the reader.
async function markRead() {
  const item = queue.items.find((i) => i.articleId === articleId.value);
  if (item) {
    await queue.updateStatus(item.id, "read");
  }
  router.back();
}

async function saveNote() {
  if (!noteContent.value.trim()) return;
  const req: CreateNoteRequest = {
    articleId: articleId.value,
    content: noteContent.value.trim(),
    noteType: "manual",
  };
  await api.post<NoteResponse>("/notes", req);
  showNoteForm.value = false;
  noteContent.value = "";
}
</script>
