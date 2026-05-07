"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columnsNode: {
      toggleColumns: (count: number) => ReturnType;
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// COLUMNS NODE
// Uses CSS Grid so each column is independent (like MS Word columns).
// 2 cols → equal halves with gap in between
// 3 cols → equal thirds with gap between each
// The column content fills naturally from top; spacebar/Enter works
// normally inside each column cell.
// ─────────────────────────────────────────────────────────────────
export const ColumnsNode = Node.create({
  name: "columnsNode",
  group: "block",
  content: "block+",
  addOptions() {
    return { HTMLAttributes: {}, count: 2 };
  },
  addAttributes() {
    return {
      count: {
        default: 2,
        parseHTML: (element) => parseInt(element.getAttribute("data-count") || "2", 10),
        renderHTML: (attributes) => {
          const n = attributes.count ?? 2;
          // Build equal grid template: n equal columns
          const template = Array(n).fill("1fr").join(" ");
          return {
            "data-count": n,
            style: [
              `display:grid`,
              `grid-template-columns:${template}`,
              `gap:8px`,
              `margin-bottom:4px`,
              `width:100%`,
            ].join(";"),
          };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-count]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      toggleColumns:
        (count: number) =>
        ({ commands, editor }: { commands: any; editor: any }) => {
          if (editor.isActive(this.name, { count })) {
            return commands.lift(this.name);
          }
          if (editor.isActive(this.name)) {
            return commands.updateAttributes(this.name, { count });
          }
          return commands.wrapIn(this.name, { count });
        },
    };
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  onCreate?: (editor: any) => void;
}

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ── Centered modal rendered into document.body via portal ──────────────────
function TableInsertModal({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
}) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-xs p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Insert Table</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Rows */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Rows</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setRows((r) => Math.max(1, r - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors shrink-0">
              −
            </button>
            <input type="number" min={1} max={30} value={rows}
              onChange={(e) => setRows(Math.max(1, Number(e.target.value)))}
              className="flex-1 text-center py-2 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <button type="button" onClick={() => setRows((r) => Math.min(30, r + 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors shrink-0">
              +
            </button>
          </div>
        </div>

        {/* Cols */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Columns</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCols((c) => Math.max(1, c - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors shrink-0">
              −
            </button>
            <input type="number" min={1} max={10} value={cols}
              onChange={(e) => setCols(Math.max(1, Number(e.target.value)))}
              className="flex-1 text-center py-2 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            <button type="button" onClick={() => setCols((c) => Math.min(10, c + 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors shrink-0">
              +
            </button>
          </div>
        </div>

        {/* Hint */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
          First row will be the header row. Click any cell and insert a placeholder like{" "}
          <span className="font-mono text-brand-500">[SEAFARER.NAME]</span>
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => onInsert(rows, cols)}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white transition-all shadow-sm">
            Insert {rows} × {cols}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Editor ────────────────────────────────────────────────────────────
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  error = false,
  onCreate,
}: RichTextEditorProps) {
  const [tableModalOpen, setTableModalOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-gray-400 before:dark:text-gray-500 before:float-left before:h-0 before:pointer-events-none",
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ColumnsNode,
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    onCreate({ editor }) {
      onCreate?.(editor);
    },
    editorProps: {
      attributes: {
        class:
          "rte-content min-h-[160px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm text-gray-800 dark:text-white/90 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    if (incoming === "" || incoming === "<p></p>") {
      const current = editor.getHTML();
      if (current !== "<p></p>" && current !== "") {
        editor.commands.setContent("");
      }
    }
  }, [value, editor]);

  const handleInsertTable = (rows: number, cols: number) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableModalOpen(false);
  };

  if (!editor) return null;

  return (
    <>
      <style>{`
        /* ── Table styles ── */
        .rte-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 8px 0;
          table-layout: fixed;
        }
        .rte-content table td,
        .rte-content table th {
          border: 1px solid #d1d5db;
          padding: 5px 8px;
          min-width: 40px;
          font-size: 0.85rem;
          vertical-align: top;
          word-break: break-word;
        }
        .rte-content table th {
          background: #f9fafb;
          font-weight: 600;
          text-align: left;
        }
        .dark .rte-content table td,
        .dark .rte-content table th {
          border-color: #374151;
        }
        .dark .rte-content table th {
          background: #1f2937;
        }
        .rte-content .selectedCell {
          background: #eff6ff !important;
        }
        .dark .rte-content .selectedCell {
          background: #1e3a5f !important;
        }

        /* ── Columns layout ── */
        /* 2 columns: left edge | gap | right edge */
        .rte-content [data-count="2"] {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 8px !important;
          width: 100% !important;
          margin-bottom: 8px !important;
          align-items: start !important;
        }
        /* 3 columns: left edge | gap | middle | gap | right edge */
        .rte-content [data-count="3"] {
          display: grid !important;
          grid-template-columns: 1fr 1fr 1fr !important;
          gap: 8px !important;
          width: 100% !important;
          margin-bottom: 8px !important;
          align-items: start !important;
        }
        /* Each direct child block inside columns starts at the top of its column */
        .rte-content [data-count] > * {
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        /* Visual divider between columns (subtle) */
        .rte-content [data-count="2"] > *:not(:last-child),
        .rte-content [data-count="3"] > *:not(:last-child) {
          border-right: 1px dashed #e5e7eb;
          padding-right: 8px;
        }
        .dark .rte-content [data-count="2"] > *:not(:last-child),
        .dark .rte-content [data-count="3"] > *:not(:last-child) {
          border-right-color: #374151;
        }
      `}</style>

      <TableInsertModal
        open={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        onInsert={handleInsertTable}
      />

      <div
        className={`rounded-xl border bg-white dark:bg-gray-900 overflow-hidden transition-colors ${
          error
            ? "border-red-500"
            : "border-gray-300 dark:border-white/10 focus-within:border-brand-500 dark:focus-within:border-brand-500"
        }`}
      >
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">

          <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <strong className="text-sm">B</strong>
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <em className="text-sm">I</em>
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
            <span className="underline text-sm">U</span>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
            <span className="line-through text-sm">S</span>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
            <span className="text-xs font-black">H1</span>
          </ToolbarButton>
          <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
            <span className="text-xs font-black">H2</span>
          </ToolbarButton>
          <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
            <span className="text-xs font-black">H3</span>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          <ToolbarButton title="Align Left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h15" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Align Center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 12h12M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Align Right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 12h12M6 18h15" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Justify" onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          {/* ── Columns (Grid-based, like Word) ── */}
          <ToolbarButton
            title="Two Columns (left | right)"
            onClick={() => editor.chain().focus().toggleColumns(2).run()}
            active={editor.isActive("columnsNode", { count: 2 })}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="2" y="4" width="9" height="16" rx="1" strokeWidth={2} />
              <rect x="13" y="4" width="9" height="16" rx="1" strokeWidth={2} />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            title="Three Columns (left | center | right)"
            onClick={() => editor.chain().focus().toggleColumns(3).run()}
            active={editor.isActive("columnsNode", { count: 3 })}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="2" y="4" width="6" height="16" rx="1" strokeWidth={2} />
              <rect x="9" y="4" width="6" height="16" rx="1" strokeWidth={2} />
              <rect x="16" y="4" width="6" height="16" rx="1" strokeWidth={2} />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          {/* ── INSERT TABLE ── */}
          <ToolbarButton title="Insert Table" onClick={() => setTableModalOpen(true)} active={tableModalOpen}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </ToolbarButton>

          {/* ── TABLE EDIT CONTROLS — only when cursor is inside a table ── */}
          {editor.isActive("table") && (
            <>
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />
              <ToolbarButton title="Add column before" onClick={() => editor.chain().focus().addColumnBefore().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M15 3v18M3 9h6M3 15h6M12 12h9" />
                </svg>
              </ToolbarButton>
              <ToolbarButton title="Add column after" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M15 3v18M12 12H3M18 9h3M18 15h3" />
                </svg>
              </ToolbarButton>
              <ToolbarButton title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18M15 3v18M3 12h6M18 12h3M12 8l-3 4 3 4" />
                </svg>
              </ToolbarButton>
              <ToolbarButton title="Add row before" onClick={() => editor.chain().focus().addRowBefore().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 15h18M9 3v6M15 3v6M12 12v9" />
                </svg>
              </ToolbarButton>
              <ToolbarButton title="Add row after" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 15h18M12 3v6M9 18v3M15 18v3" />
                </svg>
              </ToolbarButton>
              <ToolbarButton title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18M3 15h18M8 12l4-3 4 3" />
                </svg>
              </ToolbarButton>
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />
              <ToolbarButton title="Merge cells (select multiple cells first)" onClick={() => editor.chain().focus().mergeCells().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="2" y="5" width="9" height="14" rx="1" strokeWidth={2} />
                  <rect x="13" y="5" width="9" height="14" rx="1" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 12h2M8 9l-3 3 3 3M16 9l3 3-3 3" />
                </svg>
              </ToolbarButton>
              <ToolbarButton title="Split cell (only on merged cells)" onClick={() => editor.chain().focus().splitCell().run()}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="2" y="5" width="20" height="14" rx="1" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M9 9l-3 3 3 3M15 9l3 3-3 3" />
                </svg>
              </ToolbarButton>
              <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />
              <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </ToolbarButton>
            </>
          )}
        </div>

        {/* ── Editor Content ── */}
        <EditorContent editor={editor} />
      </div>
    </>
  );
}