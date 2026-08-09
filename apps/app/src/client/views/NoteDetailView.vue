<template>
  <div class="h-full flex flex-col bg-background relative">
    <BackButton to="/notes" />
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold flex-1">Note</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="note">
        <div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <span class="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
            {{ note.noteType === 'claude_conversation' ? 'claude' : note.noteType }}
          </span>
          <span>{{ formatDate(note.createdAt) }}</span>
        </div>

        <!-- Edit mode -->
        <template v-if="editing">
          <textarea
            v-model="draft"
            rows="8"
            @keydown.enter.meta="save"
            @keydown.enter.ctrl="save"
            class="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div class="flex gap-2 justify-end mt-2">
            <button
              @click="editing = false"
              class="px-3 py-1 text-sm rounded border border-border text-muted-foreground"
            >Cancel</button>
            <button
              @click="save()"
              :disabled="saving || !draft.trim()"
              class="px-3 py-1 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50"
            >{{ saving ? '…' : 'Save' }}</button>
          </div>
        </template>

        <!-- View mode (rendered Markdown) -->
        <template v-else>
          <div class="article-html text-sm text-foreground leading-relaxed" v-html="renderedNote" />
          <RouterLink
            :to="`/reader/${note.articleId}`"
            class="inline-block mt-6 text-sm text-primary underline underline-offset-4"
          >Open the source article →</RouterLink>
        </template>
      </div>
      <p v-else class="text-sm text-muted-foreground">Loading…</p>
    </div>

    <!-- Bottom action bar (edit / delete) -->
    <div
      v-if="note && !editing"
      class="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-background shrink-0"
      style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
    >
      <button
        @click="startEdit()"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
      >
        <Pencil :size="16" /> Edit
      </button>
      <button
        @click="remove()"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-destructive hover:bg-accent"
      >
        <Trash2 :size="16" /> Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteResponse } from "@feed-reader/types";
import { Pencil, Trash2 } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";
import { renderMarkdown } from "../lib/sanitize.ts";

const route = useRoute();
const router = useRouter();
const note = ref<NoteResponse | null>(null);
const renderedNote = computed(() => (note.value ? renderMarkdown(note.value.content) : ""));
const editing = ref(false);
const draft = ref("");
const saving = ref(false);

onMounted(async () => {
  note.value = await api.get<NoteResponse>(`/notes/${route.params.id}`);
});

function startEdit() {
  draft.value = note.value?.content ?? "";
  editing.value = true;
}

async function save() {
  if (!note.value || !draft.value.trim() || saving.value) return;
  saving.value = true;
  try {
    note.value = await api.patch<NoteResponse>(`/notes/${note.value.id}`, {
      content: draft.value.trim(),
    });
    editing.value = false;
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!note.value || !confirm("Delete this note?")) return;
  await api.delete(`/notes/${note.value.id}`);
  router.push("/notes");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>
