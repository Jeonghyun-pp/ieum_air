'use client';

import { useState } from 'react';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Button } from '@/components/ui/button';
import { clearEditorContent } from '@/lib/editor/storage';
import type { EditorContent } from '@/lib/editor/types';

export default function EditorPage() {
  const [content, setContent] = useState<EditorContent | null>(null);
  const [key, setKey] = useState(0);

  const handleReset = () => {
    clearEditorContent();
    setKey((prev) => prev + 1); // Force re-render
    setContent(null);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              TipTap Editor
            </h1>
            <p className="text-sm text-muted-foreground">
              Notion-like block editor with slash commands
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-sm"
          >
            Reset
          </Button>
        </div>

        {/* Editor */}
        <TiptapEditor
          key={key}
          initialContent={content || undefined}
          onUpdate={(newContent) => {
            setContent(newContent);
          }}
        />

        {/* Info */}
        <div className="mt-6 p-4 border border-border rounded-md bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Type <code className="px-1.5 py-0.5 bg-background rounded text-xs">/</code> to see
            available commands. Content is automatically saved to localStorage.
          </p>
        </div>
      </div>
    </div>
  );
}
