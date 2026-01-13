'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { EditorToolbar } from './editor-toolbar';
import { useEffect, useCallback, useState } from 'react';

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, plainText: string) => void;
  editable?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TiptapEditor({
  content = '',
  onChange,
  editable = true,
  placeholder = 'Start writing your note...',
  autoFocus = false,
}: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content ? JSON.parse(content) : '',
    editable,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = JSON.stringify(editor.getJSON());
        const text = editor.getText();
        onChange(json, text);
      }
    },
  });

  // Handle content updates from props
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      try {
        const parsedContent = JSON.parse(content);
        const currentContent = editor.getJSON();

        // Only update if content is different
        if (JSON.stringify(parsedContent) !== JSON.stringify(currentContent)) {
          editor.commands.setContent(parsedContent);
        }
      } catch {
        // If content is not JSON, treat as plain text
        if (content !== editor.getText()) {
          editor.commands.setContent(content);
        }
      }
    }
  }, [content, editor]);

  // Handle dynamic editable prop changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!isMounted) {
    return (
      <div className="border rounded-md bg-card">
        <div className="border-b p-2 h-12" />
        <div className="p-4 min-h-[300px] animate-pulse bg-muted/20" />
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md bg-card overflow-hidden">
      {editable && <EditorToolbar editor={editor} onSetLink={setLink} />}
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}
