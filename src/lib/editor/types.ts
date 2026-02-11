// ============================================
// Editor Types
// ============================================

import type { JSONContent } from '@tiptap/core';

export type EditorContent = JSONContent;

export interface EditorStorage {
  content: EditorContent | null;
  lastSaved: number;
}

export const STORAGE_KEY = 'tiptap-editor-content';
