"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    label?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className={styles.menuBar}>
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? styles.isActive : ''}
                type="button"
            >
                Bold
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? styles.isActive : ''}
                type="button"
            >
                Italic
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}
                type="button"
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? styles.isActive : ''}
                type="button"
            >
                List
            </button>
        </div>
    );
};

export default function RichTextEditor({ content, onChange, label }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: styles.editorContent,
            },
        },
        immediatelyRender: false,
    });

    // Check if content updates externally (e.g. from AI generation)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Avoid infinite loop if content is slightly different due to formatting
            // But for total replacement (like AI gen), we want to set it.
            if (Math.abs(content.length - editor.getHTML().length) > 10) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.editorWrapper}>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
