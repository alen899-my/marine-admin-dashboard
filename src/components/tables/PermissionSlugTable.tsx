"use client";

import React from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, PenBox, Trash2 } from "lucide-react";

interface Permission {
  _id: string;
  slug: string;
  description: string;
  group: string;
  status: "active" | "deprecated";
}

interface PermissionSlugTableProps {
  data: Record<string, Permission[]>;
  onView: (p: Permission) => void;
  onEdit?: (p: Permission) => void;
  onDelete?: (p: Permission) => void;
  canManage: boolean;
}

export default function PermissionSlugTable({
  data,
  onView,
  onEdit,
  onDelete,
  canManage,
}: PermissionSlugTableProps) {
  return (
    <div className="space-y-10 pb-10">
      {Object.entries(data).map(([groupName, perms]) => (
        <div key={groupName} className="space-y-4">
          {/* Group Header with Line Separator */}
          <div className="flex items-center gap-3 px-2">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
              {groupName}
            </h3>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/10"></div>
            <Badge color="light">{perms.length}</Badge>
          </div>

          {/* Themed Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 bg-brand-500 text-white font-semibold text-left text-xs uppercase tracking-wider"
                    >
                      Permission Slug
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 bg-brand-500 text-white font-semibold text-left text-xs uppercase tracking-wider"
                    >
                      Description
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 bg-brand-500 text-white font-semibold text-left text-xs uppercase tracking-wider"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 bg-brand-500 text-white font-semibold text-left text-xs uppercase tracking-wider"
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {perms.map((p, index) => (
                    <TableRow
                      key={p._id}
                      onClick={() => onView(p)}
                      className={`
                        cursor-pointer transition-colors
                        ${
                          index % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-gray-50 dark:bg-white/5"
                        }
                        hover:bg-gray-100 dark:hover:bg-white/10
                      `}
                    >
                      <TableCell className="px-5 py-3">
                        <span className="text-sm font-bold font-mono text-brand-500 bg-brand-50/50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded">
                          {p.slug}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span className="text-xs text-gray-800 dark:text-gray-200">
                          {p.description}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge color={p.status === "active" ? "success" : "default"}>
                          <span className="capitalize">{p.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-start">
                          <Button
                            size="sm"
                            variant="outline"
                            className="dark:border-gray-600"
                            onClick={() => onView(p)}
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="dark:border-gray-600"
                                onClick={() => onEdit?.(p)}
                              >
                                <PenBox className="h-4 w-4 text-yellow-500" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="dark:border-gray-600"
                                onClick={() => onDelete?.(p)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}