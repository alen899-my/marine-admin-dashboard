"use client";

import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, PenBox, Trash2, Upload } from "lucide-react";
import React from "react";

type Column<T> = {
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type ExtraColumn<T> = {
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

interface CommonReportTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  deleteLabel?: string;
  deleteClassName?: string;
  deleteVariant?:
    | "primary"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "success"
    | "warning"
    | "link";
  onUpload?: (row: T) => void;
  uploadVisible?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T, index: number) => React.Key;
  rowClassName?: (row: T, index: number) => string;
  leadingColumn?: ExtraColumn<T>;
  renderActions?: (row: T, index: number) => React.ReactNode;
  actionHeader?: React.ReactNode;
  tableMinWidthClassName?: string;
}

export default function CommonReportTable<T>({
  data,
  columns,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onUpload,
  uploadVisible,
  onView,
  onEdit,
  onDelete,
  deleteLabel,
  deleteClassName = "",
  deleteVariant = "outline",
  onRowClick,
  getRowKey,
  rowClassName,
  leadingColumn,
  renderActions,
  actionHeader = "Action",
  tableMinWidthClassName = "min-w-full",
}: CommonReportTableProps<T>) {
  const hasActionColumn =
    Boolean(renderActions) || Boolean(onView || onEdit || onUpload || onDelete);

  // Skeleton Row Component for cleaner code
  // Inside your CommonReportTable component
  const SkeletonRow = () => {
    return (
      <TableRow className="animate-pulse border-b border-gray-100 dark:border-white/5">
        {leadingColumn && (
          <TableCell className={`px-5 py-4 ${leadingColumn.cellClassName || ""}`}>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
          </TableCell>
        )}
        {columns.map((_, i) => (
          <TableCell key={i} className="px-5 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
          </TableCell>
        ))}
        {hasActionColumn && (
          <TableCell className="px-5 py-4">
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-full rounded-xl overflow-x-auto custom-scrollbar shadow-sm">
        <div className={`${tableMinWidthClassName} max-h-[65vh] overflow-y-auto relative`}>
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-white/10">
              <TableRow>
                {leadingColumn && (
                  <TableCell
                    isHeader
                    className={`sticky top-0 z-20 h-10 px-5 py-2 leading-none whitespace-nowrap bg-brand-500 text-white font-semibold text-left align-middle dark:bg-brand-500 ${leadingColumn.headerClassName || ""}`.trim()}
                  >
                    {leadingColumn.header}
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell
                    key={String(col.header)}
                    isHeader
                    className={`sticky top-0 z-20 h-10 px-5 py-2 leading-none whitespace-nowrap bg-brand-500 text-white font-semibold text-left align-middle dark:bg-brand-500 ${col.headerClassName || ""}`.trim()}
                  >
                    {col.header}
                  </TableCell>
                ))}

                {hasActionColumn && (
                  <TableCell
                    isHeader
                    className="sticky top-0 z-20 px-5 py-3 bg-brand-500 text-white font-semibold text-left dark:bg-brand-500"
                  >
                    {actionHeader}
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                // Render 5 Skeleton Rows while loading
                <>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      columns.length +
                      (leadingColumn ? 1 : 0) +
                      (hasActionColumn ? 1 : 0)
                    }
                    className="py-10 text-center text-gray-600 dark:text-gray-300"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={getRowKey?.(row, index) ?? (row as { _id?: string })._id ?? index}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      cursor-pointer transition-colors
                      ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-gray-50 dark:bg-white/5"
                      }
                      hover:bg-gray-100 dark:hover:bg-white/10
                      ${rowClassName?.(row, index) || ""}
                    `}
                  >
                    {leadingColumn && (
                      <TableCell
                        className={`px-5 py-3 ${leadingColumn.cellClassName || ""}`.trim()}
                      >
                        {leadingColumn.render(row, index)}
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={String(col.header)}
                        className={`px-5 py-3 text-left text-gray-800 dark:text-gray-200 ${col.cellClassName || ""}`.trim()}
                      >
                        {col.render(row, index)}
                      </TableCell>
                    ))}

                    {hasActionColumn && (
                      <TableCell className="px-5 py-3">
                        {renderActions ? (
                          renderActions(row, index)
                        ) : (
                          <div className="flex gap-2 justify-start">
                            {onView && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="dark:border-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onView(row);
                                }}
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            {onUpload && (!uploadVisible || uploadVisible(row)) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/50 hover:bg-emerald-500/10 dark:border-emerald-400/30 group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpload(row);
                                }}
                              >
                                <Upload className="h-4 w-4 text-emerald-500 dark:text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="dark:border-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(row);
                                }}
                              >
                                <PenBox className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}

                            {onDelete && (
                              <Button
                                size="sm"
                                variant={deleteVariant}
                                className={`${deleteVariant === "outline" ? "dark:border-gray-600" : ""} ${deleteClassName}`.trim()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(row);
                                }}
                              >
                                {deleteLabel ? (
                                  deleteLabel
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="sticky bottom-0 z-20 border-t dark:border-gray-700 bg-brand-50 dark:bg-slate-900 p-2 flex justify-center rounded-b-xl">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
