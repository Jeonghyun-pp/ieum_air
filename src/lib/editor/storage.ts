// ============================================
// Editor Storage Utilities
// ============================================

import type { EditorContent } from './types';
import { STORAGE_KEY } from './types';

export function saveEditorContent(content: EditorContent): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = {
      content,
      lastSaved: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save editor content:', error);
  }
}

export function loadEditorContent(): EditorContent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return data.content || null;
  } catch (error) {
    console.error('Failed to load editor content:', error);
    return null;
  }
}

export function clearEditorContent(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear editor content:', error);
  }
}
