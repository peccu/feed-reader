export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  isAutoCluster: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignCategoryRequest {
  categoryId: string;
  assignedBy: "manual" | "auto";
}

export interface CreateNoteRequest {
  articleId: string;
  content: string;
  noteType: "manual" | "claude_conversation" | "quote";
  claudeSessionId?: string;
}

export interface UpdateNoteRequest {
  content: string;
}

export interface NoteResponse {
  id: string;
  articleId: string;
  content: string;
  noteType: "manual" | "claude_conversation" | "quote";
  claudeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}
