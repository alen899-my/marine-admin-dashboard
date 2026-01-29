"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import PortCallDetailsCard from "./PortCallDetailsCard";
import DocumentChecklist from "./DocumentChecklist";
import { toast } from "react-toastify";
import { X, Loader2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { IoLogoWhatsapp } from "react-icons/io";
interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  userRole: string;
  onSuccess?: () => void;
  isReadOnly?: boolean;
}

export default function WorkspaceModal({ 
  isOpen, 
  onClose, 
  data, 
  userRole, 
  onSuccess, 
  isReadOnly = false 
}: WorkspaceModalProps) {
  const [pendingFiles, setPendingFiles] = useState<Record<string, { file: File, name: string, owner: string }>>({});
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { can } = useAuthorization();
 const [isZipping, setIsZipping] = useState(false);
const [isSharing, setIsSharing] = useState(false);

  if (!data) return null;

const displayedDocuments = data.documents;
const handleVerify = (docId: string, status: "approved" | "rejected", reason?: string) => {
  // 1. OPTIMISTIC UPDATE: Update the local UI immediately
  // We modify the data object reference for this render cycle
  if (data.documents && data.documents[docId]) {
    data.documents[docId].status = status;
    if (status === "rejected") {
      data.documents[docId].rejectionReason = reason;
    } else {
      data.documents[docId].rejectionReason = "";
    }
  }

  // 2. Trigger parent refresh immediately to sync background state
  if (onSuccess) onSuccess();

  // 3. Send the network payload in the background
  fetch(`/api/pre-arrival/${data._id}/verify`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, status, reason: reason || "" }),
  })
  .then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to verify document");
      // Optional: You could trigger another onSuccess here to "roll back" the UI
      if (onSuccess) onSuccess(); 
    } else {
     
    }
  })
  .catch(err => {
   
    toast.error("Network error occurred");
  });
};
const handleZipDownload = async () => {
  if (!data.documents) return;

  setIsZipping(true);
  const zip = new JSZip();
  
  // 1. Create the main root folder
  const rootFolder = zip.folder(`PreArrival_Pack_${data.requestId}`);
  
  // 2. Create sub-folders for Ship and Admin
  const shipFolder = rootFolder?.folder("Ship_Documents");
  const adminFolder = rootFolder?.folder("Admin_Documents");

  try {
    const docsToDownload = Object.entries(data.documents as Record<string, any>)
      .filter(([_, doc]) => doc.fileUrl && doc.status === "approved");

    if (docsToDownload.length === 0) {
      toast.warn("No approved files found to download.");
      setIsZipping(false);
      return;
    }

    const downloadPromises = docsToDownload.map(async ([key, doc]) => {
      try {
        const response = await fetch(doc.fileUrl);
        if (!response.ok) throw new Error("Network error");
        const blob = await response.blob();

        // Standardize file name
        const cleanDocName = doc.name.replace(/[/\\?%*:|"<>]/g, '-');
        const uniqueFileName = `${cleanDocName}_${doc.fileName}`;
        
        // ✅ LOGIC: Place file in the correct sub-folder based on owner
        if (doc.owner === "ship") {
          shipFolder?.file(uniqueFileName, blob);
        } else {
          // Defaults to Admin/Office folder
          adminFolder?.file(uniqueFileName, blob);
        }
      } catch (err) {
        console.error(`Failed to fetch: ${doc.name}`, err);
      }
    });

    await Promise.all(downloadPromises);

    // 3. Generate and Save
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `PreArrival_Pack_${data.requestId}.zip`);
    
    toast.success(`Successfully packaged ${docsToDownload.length} files`);
  } catch (error) {
    console.error("ZIP Generation Error:", error);
    toast.error("Failed to create ZIP file");
  } finally {
    setIsZipping(false);
  }
};
const handleShareViaWhatsApp = async () => {
  if (!data.documents) return;

  setIsSharing(true); // Reuse your loading state
  const zip = new JSZip();
  const rootFolder = zip.folder(`PreArrival_Pack_${data.requestId}`);
  const shipFolder = rootFolder?.folder("Ship_Documents");
  const adminFolder = rootFolder?.folder("Admin_Documents");

  try {
    const docsToDownload = Object.entries(data.documents as Record<string, any>)
      .filter(([_, doc]) => doc.fileUrl && doc.status === "approved");

    if (docsToDownload.length === 0) {
      toast.warn("No approved files found to share.");
      return;
    }

    // --- 1. Generate the ZIP (same logic as before) ---
    const downloadPromises = docsToDownload.map(async ([key, doc]) => {
      try {
        const response = await fetch(doc.fileUrl);
        const blob = await response.blob();
        const cleanDocName = doc.name.replace(/[/\\?%*:|"<>]/g, '-');
        const uniqueFileName = `${cleanDocName}_${doc.fileName}`;
        
        if (doc.owner === "ship") {
          shipFolder?.file(uniqueFileName, blob);
        } else {
          adminFolder?.file(uniqueFileName, blob);
        }
      } catch (err) { console.error(err); }
    });

    await Promise.all(downloadPromises);
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // --- 2. Upload the ZIP to Vercel Storage ---
    const zipFilename = `PreArrival_${data.requestId}_${Date.now()}.zip`;
    const uploadResponse = await fetch(`/api/upload-zip?filename=${zipFilename}`, {
      method: "POST",
      body: zipBlob,
    });

    if (!uploadResponse.ok) throw new Error("Upload failed");
    const { url: vercelUrl } = await uploadResponse.json();

    // --- 3. Share the Link via WhatsApp ---
    const message = `🚢 *Pre-Arrival Document Pack*\n\n*Vessel:* ${data.vesselId?.name}\n*Request ID:* ${data.requestId}\n*Port:* ${data.portName}\n\nClick the link below to download the approved document ZIP:\n${vercelUrl}`;
    
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, "_blank");

    toast.success("WhatsApp link generated!");
  } catch (error) {
    console.error(error);
    toast.error("Failed to share via WhatsApp");
  } finally {
    setIsSharing(false);
  }
};

  const handleFileStaging = (item: any, file: File) => {
    setPendingFiles((prev) => ({ 
      ...prev, 
      [item.id]: { file, name: item.name, owner: item.owner } 
    }));
  };

  const handleNoteStaging = (docId: string, note: string) => {
    setPendingNotes((prev) => ({ ...prev, [docId]: note }));
  };

  const handleAction = (item: any, mode: "upload" | "view") => {
    if (mode === "view") {
      const fileUrl = data.documents?.[item.id]?.fileUrl;
      if (fileUrl) window.open(fileUrl, "_blank");
    }
  };

  const handleSave = async () => {
    const changedIds = Array.from(new Set([...Object.keys(pendingFiles), ...Object.keys(pendingNotes)]));
    if (changedIds.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = changedIds.map(async (docId) => {
        const formData = new FormData();
        formData.append("docId", docId);
        
        if (pendingFiles[docId]) {
          formData.append("file", pendingFiles[docId].file);
          formData.append("name", pendingFiles[docId].name);
          formData.append("owner", pendingFiles[docId].owner);
        } else {
          const existing = data.documents?.[docId];
          if (existing) {
            formData.append("name", existing.name);
            formData.append("owner", existing.owner);
          }
        }
        if (pendingNotes[docId]) formData.append("note", pendingNotes[docId]);

        return fetch(`/api/pre-arrival/${data._id}/upload`, {
          method: "PATCH",
          body: formData,
        });
      });

      const results = await Promise.all(uploadPromises);
      if (results.every((res) => res.ok)) {
        toast.success("Document pack updated successfully");
        setPendingFiles({});
        setPendingNotes({});
        if (onSuccess) onSuccess();
        onClose(); 
      }
    } catch (error) {
      toast.error("Error saving document pack");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="
        w-full
        max-w-[95vw]
        sm:max-w-[90vw]
        md:max-w-[720px]
        lg:max-w-[1100px]
        p-4
        sm:p-6
        lg:p-8 hide-scrollbar flex flex-col"
    >
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
            {isReadOnly ? "Approved Documents" : "Upload Document Packs"}
          </h4>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="max-h-[65dvh] overflow-y-auto custom-scrollbar p-1 space-y-6 flex-1 pr-2">
        <section className="animate-in fade-in duration-300">
          <PortCallDetailsCard data={data} />
        </section>

        <section className="animate-in fade-in duration-500 pb-2">
          <DocumentChecklist
            uploadedData={displayedDocuments}
            onUpload={isReadOnly ? () => {} : handleFileStaging}
            onView={(item: any) => handleAction(item, "view")}
            onNoteChange={isReadOnly ? () => {} : handleNoteStaging}
            onVerify={isReadOnly ? () => {} : handleVerify}
            isReadOnly={isReadOnly}
          />
        </section>
      </div>

<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end w-full gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-white/5 shrink-0">
  {/* Cancel/Close Button - Stays full width on mobile, auto width on desktop */}
  <Button 
    size="sm" 
    variant="outline" 
    onClick={onClose} 
    disabled={uploading || isZipping || isSharing}
    className="w-full sm:w-auto order-last sm:order-first sm:px-6"
  >
    {isReadOnly ? "Close" : "Cancel"}
  </Button>

  {isReadOnly && can("zip.download") && (
    <>
      {/* ZIP Download Button - Optimized width for large screens */}
      <Button
        size="sm"
        variant="primary"
        className="w-full sm:w-auto sm:px-6 flex items-center justify-center"
        onClick={handleZipDownload}
        disabled={isZipping || isSharing}
      >
        {isZipping ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isZipping ? "Generating..." : "Download ZIP"}
      </Button>

      {/* Share ZIP Button - Optimized width for large screens */}
      <Button
        size="sm"
        variant="outline"
        className="w-full sm:w-auto sm:px-6 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-white/10 dark:text-gray-300 shadow-sm transition-all active:scale-95 flex items-center justify-center"
        onClick={handleShareViaWhatsApp}
        disabled={isZipping || isSharing}
      >
        {isSharing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <IoLogoWhatsapp size={18} className="mr-2 text-[#25D366]" />
        )}
        <span className="whitespace-nowrap">
          {isSharing ? "Sharing..." : "Share ZIP"}
        </span>
      </Button>
    </>
  )}

  {!isReadOnly && (
    /* Save Button - Optimized width for large screens */
    <Button
      size="sm"
      variant="primary"
      className="w-full sm:w-auto sm:px-8 flex items-center justify-center"
      onClick={handleSave}
      disabled={uploading}
    >
      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {uploading ? "Saving..." : "Save Pack"}
    </Button>
  )}
</div>

    </Modal>
  );
}
