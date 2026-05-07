"use client";

import { useEffect, useRef, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { useAuthorization } from "@/hooks/useAuthorization";
import { toast } from "react-toastify";
import {
  Clock,
  Database,
  Download,
  HardDrive,
  HardDriveDownload,
  HardDriveUpload,
  RefreshCw,
  Upload,
  Info,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import ConfirmModal from "@/components/modal/ConfirmModal";
import Tooltip2 from "@/components/ui/tooltip/Tooltip2";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";

interface BackupFile {
  name: string;
  date: string;
  size: number;
}

interface BackupInfo {
  maxBackups: number;
  files: BackupFile[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupCard() {
  const { can, isReady } = useAuthorization();
  const canManage = can("backup.manage");

  const [info, setInfo] = useState<BackupInfo | null>(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMaxWarning, setShowMaxWarning] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchInfo = async () => {
    if (!canManage) return;
    try {
      const res = await fetch("/api/backup");
      if (res.ok) setInfo(await res.json());
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (isReady && canManage) {
      fetchInfo();
    }
  }, [isReady, canManage]);

  if (isReady && !canManage) return null;

  /* ── Create backup ──────────────────────────────────────────────────── */
  const handleBackup = async () => {
    if (info && info.files.length >= info.maxBackups) {
      setShowMaxWarning(true);
      return;
    }
    executeBackup();
  };

  const executeBackup = async () => {
    setShowMaxWarning(false);
    setBacking(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Backup created successfully.");
        await fetchInfo();
      } else {
        toast.error(data.error ?? "Backup failed.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBacking(false);
    }
  };

  /* ── Download specific backup ─────────────────────────────────────────── */
  const handleDownload = (filename: string) => {
    window.location.href = `/api/backup/download?filename=${encodeURIComponent(
      filename
    )}`;
  };

  /* ── Delete backup ───────────────────────────────────────────────────── */
  const handleDeleteClick = (filename: string) => {
    setFileToDelete(filename);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/backup?filename=${encodeURIComponent(fileToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Backup deleted successfully.");
        await fetchInfo();
      } else {
        toast.error(data.error ?? "Failed to delete backup.");
      }
    } catch {
      toast.error("Network error while deleting backup.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  /* ── Restore ────────────────────────────────────────────────────────── */
  const handleRestoreClick = () => fileRef.current?.click();

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowRestoreModal(true);
  };

  const handleCancelRestore = () => {
    setShowRestoreModal(false);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConfirmRestore = async () => {
    if (!selectedFile) return;
    setShowRestoreModal(false);
    setRestoring(true);
    try {
      const form = new FormData();
      form.append("backup", selectedFile);

      const res = await fetch("/api/backup/restore", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message ?? "Restore completed.");
      } else {
        toast.error(data.error ?? "Restore failed.");
      }
    } catch {
      toast.error("Network error during restore.");
    } finally {
      setRestoring(false);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const busy = backing || restoring || deleting;

  return (
    <ComponentCard
      title={
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          <span className="text-gray-800 dark:text-white/90">
            Backup
          </span>
          <Tooltip2
            content={
              <div className="space-y-2">
                <p>
                  <strong className="text-white">Backup:</strong> Creates a
                  full snapshot of the database and uploaded assets.
                </p>
                <p>
                  <strong className="text-white">Download:</strong> Saves the
                  latest backup file to your local storage.
                </p>
                {/* <p>
                  <strong className="text-white">Restore:</strong> Replaces all
                  current data with the contents of a backup file.{" "}
                  <span className="text-red-400 font-semibold">
                    (Caution: Irreversible)
                  </span>
                </p> */}
              </div>
            }
            position="right"
          >
            <Info className="w-3 h-3 mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-help transition-colors" />
          </Tooltip2>
        </div>
      }
    >
      <div className="space-y-4">
        {/* ── Backup Files List ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 pb-1 border-b border-gray-100 dark:border-white/5">
            <span className="text-[11px] font-medium uppercase tracking-wider">
              Available Backups
            </span>
          </div>

          <div className="max-h-auto overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {info === null ? (
              <div className="text-[12px] text-gray-400 py-2 italic">
                Loading backups...
              </div>
            ) : !info.files || info.files.length === 0 ? (
              <div className="text-[12px] text-gray-400 py-2 italic">
                No backups yet
              </div>
            ) : (
              info.files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-white/5 group hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-mono text-gray-800 dark:text-gray-200">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
                      <span>{formatDate(file.date)}</span>
                      <span>•</span>
                      <span>{formatBytes(file.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleDownload(file.name)}
                      disabled={busy}
                      variant="ghost"
                      size="sm"
                      startIcon={<Download className="w-4 h-4 text-brand-500" />}
                    >
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(file.name)}
                      disabled={busy}
                      variant="ghost"
                      size="sm"
                      startIcon={<Trash2 className="w-4 h-4 text-red-500" />}
                    >
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Action buttons ─────────────────────────────────────────── */}
        <div className="flex flex-row gap-2 pt-1">
          {/* Create Backup */}
          <Button
            onClick={handleBackup}
            disabled={busy}
            variant="outline"
            size="sm"
            startIcon={
              <HardDriveDownload
                className={`w-4 h-4 ${backing ? "animate-bounce" : ""}`}
              />
            }
          >
            {backing ? "Backing up…" : "Backup"}
          </Button>



          {/* Restore */}
          {/* <Button
            onClick={handleRestoreClick}
            disabled={busy}
            variant="outline"
            size="sm"
            startIcon={
              <HardDriveUpload
                className={`w-4 h-4 ${restoring ? "animate-pulse" : ""}`}
              />
            }
          >
            {restoring ? "Restoring…" : "Restore"}
          </Button> */}

          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleRestoreFile}
          />
        </div>
      </div>

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={handleCancelRestore}
        onConfirm={handleConfirmRestore}
        title="Restore Backup"
        description="This will OVERWRITE your entire database and all uploaded files with the contents of this backup. This cannot be undone. Continue?"
        confirmLabel="Proceed with Restore"
        variant="warning"
      />
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Backup"
        description={
          <>
            Are you sure you want to delete the backup file{" "}
            <strong>{fileToDelete}</strong>? This action cannot be undone.
          </>
        }
        loading={deleting}
      />
      <ConfirmModal
        isOpen={showMaxWarning}
        onClose={() => setShowMaxWarning(false)}
        onConfirm={executeBackup}
        title="Max Backups Reached"
        description={`You have reached the maximum limit of ${info?.maxBackups} backups. Creating a new backup will permanently delete the oldest backup. Do you want to proceed?`}
        confirmLabel="Proceed & Delete Oldest"
        variant="warning"
      />
    </ComponentCard>
  );
}
