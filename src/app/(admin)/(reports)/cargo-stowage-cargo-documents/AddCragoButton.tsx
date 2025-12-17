"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import FileInput from "@/components/form/input/FileInput";
import { ChevronDownIcon } from "lucide-react";

interface AddCargoReportButtonProps {
  onSuccess: () => void;
}

export default function AddCargoButton({onSuccess}: AddCargoReportButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form State
 const getCurrentDateTime: () => string = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };
  const [formData, setFormData] = useState({
    vesselName: "",
    voyageNo: "",
    portName: "",
    reportDate: getCurrentDateTime(),
    portType: "",
    documentType: "",
    documentDate: "",
    remarks: "",
  });

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Options Data
  const portTypeOptions = [
    { value: "load", label: "Load Port" },
    { value: "discharge", label: "Discharge Port" },
    { value: "departure", label: "Departure Port" },
  ];

  const docTypeOptions = [
    { value: "stowage_plan", label: "Cargo Stowage Plan" },
    { value: "cargo_documents", label: "Cargo Documents" },
    { value: "other", label: "Other" },
  ];

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[name];
        return newErr;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[name];
        return newErr;
      });
    }
  };

  // Handler for DatePicker
  const handleDateChange = (dates: Date[], currentDateString: string) => {
    setFormData((prev) => ({ ...prev, documentDate: currentDateString }));
    
    if (errors.documentDate) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.documentDate;
        return newErr;
      });
    }
  };

  // Handler for FileInput with 500KB Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check size (500 KB)
      if (file.size > 500 * 1024) {
        setErrors((prev) => ({ ...prev, file: "File size must be below 500 KB." }));
        setSelectedFile(null);
        e.target.value = ""; // Reset input
        return;
      }

      setSelectedFile(file);
      
      if (errors.file) {
        setErrors((prev) => {
          const newErr = { ...prev };
          delete newErr.file;
          return newErr;
        });
      }
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData({
      vesselName: "",
      voyageNo: "",
      portName: "",
       reportDate: getCurrentDateTime(), // ✅ NEW: Reset to current time
      portType: "",
      documentType: "",
      documentDate: "",
      remarks: "",
    });
    setSelectedFile(null);
    closeModal();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // --- Validation ---
    const newErrors: Record<string, string> = {};
    if (!formData.vesselName) newErrors.vesselName = "Vessel Name is required";
    if (!formData.voyageNo) newErrors.voyageNo = "Voyage No is required";
    if (!formData.portName) newErrors.portName = "Port Name is required";
    if (!formData.portType) newErrors.portType = "Port Type is required";
    if (!formData.documentType) newErrors.documentType = "Document Type is required";
    if (!formData.documentDate) newErrors.documentDate = "Date is required";
    if (!selectedFile) newErrors.file = "File is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      // --- Payload Preparation ---
      const payload = new FormData();
      payload.append("vesselName", formData.vesselName);
      payload.append("voyageNo", formData.voyageNo);
      payload.append("reportDate", formData.reportDate ? `${formData.reportDate}+05:30` : "");
      payload.append("portName", formData.portName);
      payload.append("portType", formData.portType);
      payload.append("documentType", formData.documentType);
      payload.append("documentDate", formData.documentDate);
      payload.append("remarks", formData.remarks);
      
      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      // --- API Call ---
      const res = await fetch("/api/cargo", {
        method: "POST",
        body: payload, 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit document");
      }

      toast.success("Cargo document uploaded successfully!");
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>
        Add Cargo Doc
      </Button>

      <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      className={`
        w-full
        max-w-[95vw]
        sm:max-w-[90vw]
        md:max-w-[720px]
        lg:max-w-[900px]
        p-4
        sm:p-6
        lg:p-8
      `}
      >
        <AddForm
          title="Add Cargo Document"
          description="Upload stowage plans and cargo-related documentation."
          submitLabel={isSubmitting ? "Uploading..." : "Submit Cargo Document"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                                 <Label>Reporting Date & Time <span className="text-red-500">*</span></Label>
                                 <Input
                                   type="datetime-local"
                                   name="reportDate"
                                   value={formData.reportDate}
                                   onChange={handleChange}
                                   className={errors.reportDate ? "border-red-500" : ""}
                                 />
                                 {errors.reportDate && (
                                   <p className="text-xs text-red-500 mt-1">{errors.reportDate}</p>
                                 )}
                               </div>
                <div>
                  <Label>Vessel Name <span className="text-red-500">*</span></Label>
                  <Input
                    name="vesselName"
                    value={formData.vesselName}
                    onChange={handleChange}
                    className={errors.vesselName ? "border-red-500" : ""}
                  />
                  {errors.vesselName && <p className="text-xs text-red-500 mt-1">{errors.vesselName}</p>}
                </div>

                <div>
                  <Label>Voyage No / ID <span className="text-red-500">*</span></Label>
                  <Input
                    name="voyageNo"
                    value={formData.voyageNo}
                    onChange={handleChange}
                    className={errors.voyageNo ? "border-red-500" : ""}
                  />
                  {errors.voyageNo && <p className="text-xs text-red-500 mt-1">{errors.voyageNo}</p>}
                </div>

                <div>
                  <Label>Port Name <span className="text-red-500">*</span></Label>
                  <Input
                    name="portName"
                    value={formData.portName}
                    onChange={handleChange}
                    className={errors.portName ? "border-red-500" : ""}
                  />
                  {errors.portName && <p className="text-xs text-red-500 mt-1">{errors.portName}</p>}
                </div>

                <div>
                  <Label>Port Type <span className="text-red-500">*</span></Label>
                  {/* Select Structure preserved with external Chevron */}
                  <div className="relative">
                    <Select
                      options={portTypeOptions}
                      placeholder="Select Port Type"
                      value={formData.portType}
                      onChange={(val) => handleSelectChange("portType", val)}
                      className={`${errors.portType ? "border-red-500" : ""} dark:bg-dark-900`}
                    />
                    
                  </div>
                  {errors.portType && <p className="text-xs text-red-500 mt-1">{errors.portType}</p>}
                </div>
              </div>
            </ComponentCard>

            {/* DOCUMENT TYPE & UPLOAD */}
            <ComponentCard title="Document Type & Upload">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Document Type <span className="text-red-500">*</span></Label>
                  {/* Select Structure preserved with external Chevron */}
                  <div className="relative">
                    <Select
                      options={docTypeOptions}
                      placeholder="Select Type"
                      value={formData.documentType}
                      onChange={(val) => handleSelectChange("documentType", val)}
                      className={`${errors.documentType ? "border-red-500" : ""} dark:bg-dark-900`}
                    />
                   
                  </div>
                  {errors.documentType && <p className="text-xs text-red-500 mt-1">{errors.documentType}</p>}
                </div>

                <div>
                  {/* Replaced Input type="date" with DatePicker */}
                  <DatePicker
                    id="document-date"
                    label="Document Date"
                    placeholder="Select a date"
                    onChange={handleDateChange}
                  />
                  {errors.documentDate && <p className="text-xs text-red-500 mt-1">{errors.documentDate}</p>}
                </div>
              </div>

              <div className="mt-4">
                <Label>Upload File (PDF / Image / Excel) - Max 500 KB <span className="text-red-500">*</span></Label>
                {/* Replaced manual file input div with FileInput component */}
                <div className={errors.file ? "border border-red-500 rounded-lg" : ""}>
                   <FileInput 
                     className="w-full"
                     onChange={handleFileChange} 
                   />
                </div>
                {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
              </div>
            </ComponentCard>

            {/* REMARKS */}
            <ComponentCard title="Remarks">
              <Label>Remarks</Label>
              <TextArea
                name="remarks"
                rows={4}
                placeholder="Any additional information related to cargo plan or documents."
                value={formData.remarks}
                onChange={handleChange}
              />
            </ComponentCard>

          </div>
        </AddForm>
      </Modal>
    </>
  );
}