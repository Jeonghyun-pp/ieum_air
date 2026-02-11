'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { SlashCommandItem } from './SlashCommandMenu';

// ============================================
// Types
// ============================================

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: any; range: any }) => void;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: any;
}

// ============================================
// Slash Command Menu Component
// ============================================

export const SlashCommandMenu = forwardRef<
  { onKeyDown: (event: KeyboardEvent) => boolean },
  SlashCommandMenuProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="z-50 min-w-[280px] rounded-md border border-border bg-background shadow-lg p-1">
      <div className="max-h-[300px] overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`
              w-full flex items-start gap-3 px-3 py-2 rounded text-left
              transition-colors duration-100 ease-out
              ${
                index === selectedIndex
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }
            `}
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-sm font-medium">
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';
