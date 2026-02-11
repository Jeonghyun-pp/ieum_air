'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useCallback } from 'react';
import { editorExtensions } from './editorExtensions';
import { SlashCommand } from './SlashCommand';
import { EditorToolbar } from './EditorToolbar';
import { saveEditorContent, loadEditorContent } from '@/lib/editor/storage';
import type { EditorContent as EditorContentType } from '@/lib/editor/types';
import './editorStyles.css';

interface TiptapEditorProps {
  initialContent?: EditorContentType;
  onUpdate?: (content: EditorContentType) => void;
}

let debounceTimer: NodeJS.Timeout | null = null;

export function TiptapEditor({
  initialContent,
  onUpdate,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [...editorExtensions, SlashCommand],
    content: initialContent || loadEditorContent() || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      
      // Debounce save to localStorage
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        saveEditorContent(content);
      }, 800);

      // Call onUpdate callback immediately
      if (onUpdate) {
        onUpdate(content);
      }
    },
  });

  // Load content on mount
  useEffect(() => {
    if (editor && !initialContent) {
      const saved = loadEditorContent();
      if (saved) {
        editor.commands.setContent(saved);
      }
    }
  }, [editor, initialContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="border border-border rounded-md bg-background p-8">
        <p className="text-muted-foreground text-center">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="border border-border rounded-md bg-background shadow-sm">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
