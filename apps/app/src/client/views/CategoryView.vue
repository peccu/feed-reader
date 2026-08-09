<template>
  <div class="h-full flex flex-col bg-background relative">
    <BackButton />
    <div
      class="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
      style="padding-top: max(0.5rem, env(safe-area-inset-top))"
    >
      <h1 class="text-base font-semibold flex-1">Categories</h1>
      <button
        @click="showNew = true"
        class="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground"
      >+ Add</button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- New category form -->
      <form
        v-if="showNew"
        @submit.prevent="createCategory()"
        class="p-3 rounded-lg border border-primary bg-card space-y-2"
      >
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Category</p>
        <label class="block">
          <span class="text-xs text-muted-foreground">Name (required) — e.g. "AI", "Gadgets", "日本酒"</span>
          <input
            v-model="newName"
            placeholder="Category name"
            required
            class="mt-1 w-full px-3 py-1.5 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </label>
        <label class="block">
          <span class="text-xs text-muted-foreground">Description (optional) — what belongs in this category</span>
          <input
            v-model="newDesc"
            placeholder="Optional description"
            class="mt-1 w-full px-3 py-1.5 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </label>
        <div class="flex items-center gap-2">
          <label class="text-xs text-muted-foreground">Color</label>
          <input v-model="newColor" type="color" class="h-7 w-10 rounded border border-input cursor-pointer" />
          <span class="text-xs text-muted-foreground">{{ newColor }}</span>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            @click="cancelNew()"
            class="px-3 py-1 text-sm rounded border border-border text-muted-foreground"
          >Cancel</button>
          <button
            type="submit"
            :disabled="saving"
            class="px-3 py-1 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50"
          >{{ saving ? '…' : 'Save' }}</button>
        </div>
      </form>

      <!-- Category list -->
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="rounded-lg border border-border bg-card overflow-hidden"
      >
        <!-- View mode -->
        <div v-if="editingId !== cat.id" class="flex items-center gap-3 p-3">
          <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: cat.color ?? '#888' }" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground">{{ cat.name }}</p>
            <p v-if="cat.description" class="text-xs text-muted-foreground truncate">{{ cat.description }}</p>
          </div>
          <span v-if="cat.isAutoCluster" class="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">Auto</span>
          <button
            @click="startEdit(cat)"
            class="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
          >Edit</button>
          <button
            @click="deleteCategory(cat.id)"
            class="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded hover:bg-accent"
          >✕</button>
        </div>

        <!-- Edit mode -->
        <form v-else @submit.prevent="saveEdit(cat.id)" class="p-3 space-y-2">
          <label class="block">
            <span class="text-xs text-muted-foreground">Name (required)</span>
            <input
              v-model="editName"
              placeholder="Category name"
              required
              class="mt-1 w-full px-3 py-1.5 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          <label class="block">
            <span class="text-xs text-muted-foreground">Description (optional)</span>
            <input
              v-model="editDesc"
              placeholder="Optional description"
              class="mt-1 w-full px-3 py-1.5 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">Color</label>
            <input v-model="editColor" type="color" class="h-7 w-10 rounded border border-input cursor-pointer" />
            <span class="text-xs text-muted-foreground">{{ editColor }}</span>
          </div>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              @click="editingId = null"
              class="px-3 py-1 text-sm rounded border border-border text-muted-foreground"
            >Cancel</button>
            <button
              type="submit"
              :disabled="saving"
              class="px-3 py-1 text-sm rounded bg-primary text-primary-foreground disabled:opacity-50"
            >{{ saving ? '…' : 'Save' }}</button>
          </div>
        </form>
      </div>

      <p v-if="categories.length === 0 && !showNew" class="text-sm text-muted-foreground text-center py-8">
        No categories yet — tap "+ Add" to create one
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryResponse } from "@feed-reader/types";
import { onMounted, ref } from "vue";
import { api } from "../api/client.ts";
import BackButton from "../components/BackButton.vue";

const categories = ref<CategoryResponse[]>([]);
const showNew = ref(false);
const saving = ref(false);

const newName = ref("");
const newDesc = ref("");
const newColor = ref("#6366f1");

const editingId = ref<string | null>(null);
const editName = ref("");
const editDesc = ref("");
const editColor = ref("#888888");

async function load() {
  const res = await api.get<{ items: CategoryResponse[] }>("/categories");
  categories.value = res.items;
}

onMounted(load);

function cancelNew() {
  showNew.value = false;
  newName.value = "";
  newDesc.value = "";
  newColor.value = "#6366f1";
}

async function createCategory() {
  if (!newName.value.trim() || saving.value) return;
  saving.value = true;
  try {
    await api.post("/categories", {
      name: newName.value.trim(),
      description: newDesc.value || null,
      color: newColor.value,
    });
    cancelNew();
    await load();
  } finally {
    saving.value = false;
  }
}

function startEdit(cat: CategoryResponse) {
  editingId.value = cat.id;
  editName.value = cat.name;
  editDesc.value = cat.description ?? "";
  editColor.value = cat.color ?? "#888888";
}

async function saveEdit(id: string) {
  if (!editName.value.trim() || saving.value) return;
  saving.value = true;
  try {
    await api.patch(`/categories/${id}`, {
      name: editName.value.trim(),
      description: editDesc.value || null,
      color: editColor.value,
    });
    editingId.value = null;
    await load();
  } finally {
    saving.value = false;
  }
}

async function deleteCategory(id: string) {
  if (!confirm("Delete this category?")) return;
  await api.delete(`/categories/${id}`);
  await load();
}
</script>
