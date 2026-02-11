'use client';

import { useEditor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor> | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-background rounded-t-md">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bold') && 'bg-accent'
          )}
          aria-label="Bold"
        >
          <span className="text-sm font-bold">B</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('italic') && 'bg-accent'
          )}
          aria-label="Italic"
        >
          <span className="text-sm italic">I</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('underline') && 'bg-accent'
          )}
          aria-label="Underline"
        >
          <span className="text-sm underline">U</span>
        </Button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'h-8 px-2 text-xs',
            editor.isActive('heading', { level: 1 }) && 'bg-accent'
          )}
          aria-label="Heading 1"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'h-8 px-2 text-xs',
            editor.isActive('heading', { level: 2 }) && 'bg-accent'
          )}
          aria-label="Heading 2"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'h-8 px-2 text-xs',
            editor.isActive('heading', { level: 3 }) && 'bg-accent'
          )}
          aria-label="Heading 3"
        >
          H3
        </Button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bulletList') && 'bg-accent'
          )}
          aria-label="Bullet List"
        >
          <span className="text-sm">•</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('orderedList') && 'bg-accent'
          )}
          aria-label="Numbered List"
        >
          <span className="text-sm">1.</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('taskList') && 'bg-accent'
          )}
          aria-label="Task List"
        >
          <span className="text-sm">☐</span>
        </Button>
      </div>

      {/* Blocks */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'h-8 px-2 text-xs',
            editor.isActive('blockquote') && 'bg-accent'
          )}
          aria-label="Quote"
        >
          "
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            'h-8 px-2 text-xs',
            editor.isActive('codeBlock') && 'bg-accent'
          )}
          aria-label="Code Block"
        >
          {'</>'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={cn(
            'h-8 px-2 text-xs',
            editor.isActive('link') && 'bg-accent'
          )}
          aria-label="Link"
        >
          Link
        </Button>
      </div>
    </div>
  );
}
