"use client";

import React, { useState } from "react";
import Button from "../button/Button";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  Table,
  Columns,
  Rows,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Download
} from "lucide-react";
import { getNextCopyName } from "@/lib/utils";

export interface TableColumn {
  id: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableRow {
  id: string;
  cells: string[];
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: TableRow[];
}

interface TableBuilderProps {
  value?: TableData[];
  onChange?: (tables: TableData[]) => void;
  placeholderCards?: { id: string; title: string; items: { key: string; label: string }[] }[];
  onInsertPlaceholder?: (key: string) => void;
}

const TableBuilder: React.FC<TableBuilderProps> = ({
  value = [],
  onChange,
  placeholderCards = [],
  onInsertPlaceholder,
}) => {
  const [tables, setTables] = useState<TableData[]>(value);
  const [expandedTable, setExpandedTable] = useState<string | null>(value[0]?.id || null);

  const addTable = () => {
    const newTable: TableData = {
      id: `table_${Date.now()}`,
      title: `Table ${tables.length + 1}`,
      columns: [
        { id: `col_1`, header: "Column 1", width: "auto", align: "left" },
        { id: `col_2`, header: "Column 2", width: "auto", align: "left" },
      ],
      rows: [
        { id: `row_1`, cells: ["", ""] },
        { id: `row_2`, cells: ["", ""] },
      ],
    };
    const updated = [...tables, newTable];
    setTables(updated);
    setExpandedTable(newTable.id);
    onChange?.(updated);
  };

  const removeTable = (tableId: string) => {
    const updated = tables.filter((t) => t.id !== tableId);
    setTables(updated);
    onChange?.(updated);
    if (expandedTable === tableId) {
      setExpandedTable(updated[0]?.id || null);
    }
  };

  const updateTable = (tableId: string, updates: Partial<TableData>) => {
    const updated = tables.map((t) => (t.id === tableId ? { ...t, ...updates } : t));
    setTables(updated);
    onChange?.(updated);
  };

  const addColumn = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const newCol: TableColumn = {
      id: `col_${Date.now()}`,
      header: `Column ${table.columns.length + 1}`,
      width: "auto",
      align: "left",
    };
    updateTable(tableId, {
      columns: [...table.columns, newCol],
      rows: table.rows.map((r) => ({ ...r, cells: [...r.cells, ""] })),
    });
  };

  const removeColumn = (tableId: string, colIndex: number) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.columns.length <= 1) return;
    updateTable(tableId, {
      columns: table.columns.filter((_, i) => i !== colIndex),
      rows: table.rows.map((r) => ({ ...r, cells: r.cells.filter((_, i) => i !== colIndex) })),
    });
  };

  const addRow = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const newRow: TableRow = {
      id: `row_${Date.now()}`,
      cells: new Array(table.columns.length).fill(""),
    };
    updateTable(tableId, {
      rows: [...table.rows, newRow],
    });
  };

  const removeRow = (tableId: string, rowIndex: number) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.rows.length <= 1) return;
    updateTable(tableId, {
      rows: table.rows.filter((_, i) => i !== rowIndex),
    });
  };

  const updateCell = (tableId: string, rowIndex: number, colIndex: number, value: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const updatedRows = table.rows.map((r, ri) =>
      ri === rowIndex
        ? { ...r, cells: r.cells.map((c, ci) => (ci === colIndex ? value : c)) }
        : r
    );
    updateTable(tableId, { rows: updatedRows });
  };

  const updateColumn = (tableId: string, colIndex: number, updates: Partial<TableColumn>) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const updatedColumns = table.columns.map((c, i) => (i === colIndex ? { ...c, ...updates } : c));
    updateTable(tableId, { columns: updatedColumns });
  };

  const duplicateTable = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const newTable: TableData = {
      ...table,
      id: `table_${Date.now()}`,
      title: getNextCopyName(table.title, tables.map(t => t.title)),
      columns: table.columns.map((c) => ({ ...c, id: `col_${Date.now()}_${c.id}` })),
      rows: table.rows.map((r) => ({ ...r, id: `row_${Date.now()}_${r.id}` })),
    };
    const updated = [...tables, newTable];
    setTables(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-3">
      {tables.map((table) => (
        <div
          key={table.id}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
        >
          {/* Table Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
            onClick={() => setExpandedTable(expandedTable === table.id ? null : table.id)}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              <Table className="w-4 h-4 text-brand-500" />
              <input
                type="text"
                value={table.title}
                onChange={(e) => {
                  e.stopPropagation();
                  updateTable(table.id, { title: e.target.value });
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-medium bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateTable(table.id);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="Duplicate"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTable(table.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {expandedTable === table.id ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* Table Content */}
          {expandedTable === table.id && (
            <div className="p-4 space-y-4">
              {/* Placeholder chips */}
              {placeholderCards.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {placeholderCards.flatMap((card) =>
                    card.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onInsertPlaceholder?.(item.key)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {item.label}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Column Headers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Columns</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addColumn(table.id)}
                    startIcon={<Plus className="w-3 h-3" />}
                  >
                    Add Column
                  </Button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {table.columns.map((col, colIndex) => (
                    <div
                      key={col.id}
                      className="flex-shrink-0 w-32 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-1 mb-2">
                        <input
                          type="text"
                          value={col.header}
                          onChange={(e) => updateColumn(table.id, colIndex, { header: e.target.value })}
                          className="flex-1 text-xs font-medium bg-transparent border-none outline-none text-gray-800 dark:text-gray-200"
                          placeholder="Header"
                        />
                        {table.columns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColumn(table.id, colIndex)}
                            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateColumn(table.id, colIndex, { align: "left" })}
                          className={`p-1 rounded ${col.align === "left" ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"}`}
                        >
                          <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateColumn(table.id, colIndex, { align: "center" })}
                          className={`p-1 rounded ${col.align === "center" ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"}`}
                        >
                          <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateColumn(table.id, colIndex, { align: "right" })}
                          className={`p-1 rounded ${col.align === "right" ? "bg-brand-100 dark:bg-brand-500/20 text-brand-600" : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"}`}
                        >
                          <AlignRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rows</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addRow(table.id)}
                    startIcon={<Plus className="w-3 h-3" />}
                  >
                    Add Row
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-8 p-2"></th>
                        {table.columns.map((col, colIndex) => (
                          <th
                            key={col.id}
                            className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => (
                        <tr key={row.id} className="group">
                          <td className="p-1">
                            {table.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRow(table.id, rowIndex)}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                          {row.cells.map((cell, cellIndex) => (
                            <td key={`${row.id}_${cellIndex}`} className="p-1">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => updateCell(table.id, rowIndex, cellIndex, e.target.value)}
                                className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-brand-500"
                                placeholder={`Row ${rowIndex + 1}, Col ${cellIndex + 1}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Table Button */}
      <Button
        variant="outline"
        onClick={addTable}
        startIcon={<Plus className="w-4 h-4" />}
        className="w-full justify-center"
      >
        Add Table
      </Button>
    </div>
  );
};

export default TableBuilder;
