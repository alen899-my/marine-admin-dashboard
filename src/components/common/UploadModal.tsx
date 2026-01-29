"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Loader2, Upload, FileText, X } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onUpload: (file: File) => Promise<void> | void;
  loading?: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  title,
  onUpload,
  loading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || loading) return;
    await onUpload(selectedFile);
    setSelectedFile(null); 
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6 lg:p-8"
    >
      <form onSubmit={handleSubmit}>
        {/* HEADER */}
        <h4 className="mb-2 text-lg font-bold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-medium">
          Accepted formats: PDF, PNG, JPG (Max 5MB)
        </p>

        {/* BODY - UPLOAD AREA */}
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`
            relative group cursor-pointer border-2 border-dashed rounded-xl p-8 
            flex flex-col items-center justify-center transition-all
            ${selectedFile 
              ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5" 
              : "border-gray-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50"
            }
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={loading}
          />

          {!selectedFile ? (
            <>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-full text-emerald-600 mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Click to browse or drag file here
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full animate-in fade-in zoom-in duration-200">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!loading && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* FOOTER - Matched to EditModal Style */}
        <div className="flex items-center justify-end w-full gap-3 mt-8">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            type="submit"
            disabled={loading || !selectedFile}
            className={`min-w-[120px] ${!selectedFile ? 'bg-gray-300' : 'bg-emerald-600 hover:bg-emerald-700'} border-none`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              "Confirm Upload"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadModal;