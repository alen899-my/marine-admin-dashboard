"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "react-toastify";
import Input from "@/components/form/input/InputField";
import Image from "next/image";

import { useAuthorization } from "@/hooks/useAuthorization";
import { useSidebarNotifications } from "@/context/SidebarNotificationContext";

interface ChecklistItem {
  _id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  initialChecklist: ChecklistItem[];
  onUpdate?: () => void;
  embedded?: boolean;
  profilePhoto?: string;
  positionApplied?: string;
}

export default function ChecklistModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  initialChecklist,
  onUpdate,
  embedded = false,
  profilePhoto,
  positionApplied,
}: ChecklistModalProps) {
  const { can } = useAuthorization();
  const { refreshCounts } = useSidebarNotifications();
  const canChecklistAdd = can("onboarding.checklistadding");
  const canDelete = can("onboarding.delete");

  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
  const [newText, setNewText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(initialChecklist);
  }, [initialChecklist]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const completedCount = items.filter((i) => i.completed).length;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/onboarding?id=${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      setItems(data.checklist);
      setNewText("");
      await refreshCounts();
      onUpdate?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i._id === item._id ? { ...i, completed: !i.completed } : i))
    );
    try {
      const res = await fetch(`/api/onboarding?id=${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", itemId: item._id, completed: !item.completed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update item");
      setItems(data.checklist);
      await refreshCounts();
      onUpdate?.();
    } catch (err: any) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, completed: item.completed } : i))
      );
      toast.error(err.message);
    }
  };

  const handleDelete = async (itemId: string) => {
    const prev = [...items];
    setItems((cur) => cur.filter((i) => i._id !== itemId));
    try {
      const res = await fetch(`/api/onboarding?id=${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      setItems(data.checklist);
      await refreshCounts();
      onUpdate?.();
    } catch (err: any) {
      setItems(prev);
      toast.error(err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
  };

  const content = (
    <>
      {/* Header */}
      <div className="shrink-0 mb-4 flex items-center gap-4 border-b border-gray-100 dark:border-white/10 pb-4">
        {profilePhoto ? (
          <div className="relative h-12 w-12 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
            <Image
              src={profilePhoto}
              alt={candidateName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg border border-brand-200 dark:border-brand-800 shrink-0">
            {candidateName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h4 className="text-xl font-medium text-gray-800 dark:text-white/90">
            Onboarding Checklist
          </h4>
          <p className="text-sm mt-0.5 text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span className="font-medium text-gray-700 dark:text-gray-300">{candidateName}</span>
            {positionApplied && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span>{positionApplied}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="shrink-0 mb-4">
          <div className="hidden sm:block mb-3">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {completedCount} / {items.length} Tasks Done
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 sm:hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Progress</span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">{Math.round((completedCount / items.length) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Body / List */}
      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              No tasks added yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
              Add checklist items below to begin onboarding.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {items.map((item) => (
              <div
                key={item._id}
                className={`group flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                  item.completed
                    ? "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10"
                    : "bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-brand-200 dark:hover:border-brand-500/30"
                }`}
              >
                <button
                  onClick={() => handleToggle(item)}
                  className="my-1 shrink-0 transition-transform active:scale-90"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand-400" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm font-medium leading-relaxed my-0.5 ${
                    item.completed
                      ? "line-through text-gray-400 dark:text-gray-500"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => handleDelete(item._id)}
                  className={`shrink-0 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 ${canDelete ? "opacity-0 group-hover:opacity-100" : "hidden"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="mt-6 shrink-0">
        {canChecklistAdd ? (
          <div className="flex gap-2">
            <div className="flex-1 mt-0.5">
              <Input
                ref={inputRef}
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a checklist item (e.g. Verify Medical Certificate)"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={isAdding || !newText.trim()}
            >
              {!isAdding && <Plus className="w-4 h-4" />}
              {isAdding ? "Adding..." : "Add"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center">You don&apos;t have permission to add checklist items</p>
        )}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 overflow-hidden p-4 sm:p-6 lg:p-8">
        {content}
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[600px] p-4 sm:p-6 lg:p-8"
    >
      {content}
    </Modal>
  );
}
