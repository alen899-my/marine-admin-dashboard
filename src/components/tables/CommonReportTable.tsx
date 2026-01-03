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
import { Eye, Loader2, PenBox, Trash2 } from "lucide-react";
import React from "react";

type Column<T> = {
  header: string;
  render: (row: T, index: number) => React.ReactNode;
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
  onRowClick?: (row: T) => void;
}

export default function CommonReportTable<T>({
  data,
  columns,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onRowClick,
}: CommonReportTableProps<T>) {
  return (
    <div className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-full rounded-xl overflow-hidden shadow-sm">
        <div className="min-w-[1200px] max-h-[65vh] overflow-y-auto relative">
          <Table>
            <TableHeader className="bg-gray-100 dark:bg-white/10">
              <TableRow>
                {columns.map((col) => (
                    <TableCell
                    key={col.header}
                    isHeader
                    className="
    sticky top-0 z-20
    h-10
    px-5 py-2
    leading-none
    whitespace-nowrap
    bg-brand-500 text-white
    font-semibold text-left
    align-middle
    dark:bg-brand-500
  "
                  >
                    {col.header}
                  </TableCell>
                ))}

                {(onView || onEdit || onDelete) && (
                  <TableCell
                    isHeader
                    className="
                      sticky top-0 z-20
                      px-5 py-3 
                      bg-brand-500 text-white 
                      font-semibold text-left
                      dark:bg-brand-500
                    "
                  >
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="py-10 text-center"
                  >
                    <div className="flex justify-center gap-2 text-gray-700 dark:text-gray-300">
                      <Loader2 className="animate-spin" />
                      Loading Reports...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="py-10 text-center text-gray-600 dark:text-gray-300"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                data.map((row, index) => (
                  <TableRow
                    key={(row as { _id?: string })._id ?? index}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      cursor-pointer
                      transition-colors
                      ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-gray-50 dark:bg-white/5"
                      }
                      hover:bg-gray-100 
                      dark:hover:bg-white/10
                    `}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.header}
                        className="
                          px-5 py-3 text-left 
                          text-gray-800 dark:text-gray-200
                        "
                      >
                        {col.render(row, index)}
                      </TableCell>
                    ))}

                    {(onView || onEdit || onDelete) && (
                      <TableCell className="px-5 py-3">
                        <div className="flex gap-2 justify-start">
                          {onView && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="dark:border-gray-600"
                              onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        onView(row);
                      }}
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}

                          {onEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="dark:border-gray-600"
                              onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        onEdit(row);
                      }}
                            >
                              <PenBox className="h-4 w-4 text-yellow-500" />
                            </Button>
                          )}

                          {onDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="dark:border-gray-600"
                              onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        onDelete(row);
                      }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
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
