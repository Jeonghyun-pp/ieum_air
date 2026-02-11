// ============================================
// Slash Command Extension
// ============================================

import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, {
  type SuggestionOptions,
} from '@tiptap/suggestion';
import { SlashCommandMenu } from './SlashCommandMenu';
import type { SlashCommandItem } from './SlashCommandMenu';

export interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }) => {
          const commands: SlashCommandItem[] = [
            {
              title: 'Heading 1',
              description: 'Big section heading',
              icon: 'H1',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHeading({ level: 1 })
                  .run();
              },
            },
            {
              title: 'Heading 2',
              description: 'Medium section heading',
              icon: 'H2',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHeading({ level: 2 })
                  .run();
              },
            },
            {
              title: 'Heading 3',
              description: 'Small section heading',
              icon: 'H3',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHeading({ level: 3 })
                  .run();
              },
            },
            {
              title: 'Bullet List',
              description: 'Create a bullet list',
              icon: '•',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBulletList()
                  .run();
              },
            },
            {
              title: 'Numbered List',
              description: 'Create a numbered list',
              icon: '1.',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleOrderedList()
                  .run();
              },
            },
            {
              title: 'Todo List',
              description: 'Create a todo list',
              icon: '☐',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleTaskList()
                  .run();
              },
            },
            {
              title: 'Quote',
              description: 'Create a quote block',
              icon: '"',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBlockquote()
                  .run();
              },
            },
            {
              title: 'Code Block',
              description: 'Create a code block',
              icon: '</>',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleCodeBlock()
                  .run();
              },
            },
            {
              title: 'Divider',
              description: 'Insert a horizontal line',
              icon: '—',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHorizontalRule()
                  .run();
              },
            },
          ];

          return commands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          let component: ReactRenderer;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });
            },

            onUpdate(props: any) {
              component?.updateProps(props);
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                component?.destroy();
                return true;
              }

              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit() {
              component?.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
