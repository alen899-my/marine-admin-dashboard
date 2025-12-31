"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react"; // Added useEffect
import { toast } from "react-toastify";

// Imports - Adjust paths to match your project structure
import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select"; // Added Select Import
import FileInput from "@/components/form/input/FileInput";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useAuthorization } from "@/hooks/useAuthorization";
import SearchableSelect from "@/components/form/SearchableSelect";
// Import validation schema (adjust path as needed)
import { norSchema } from "@/lib/validations/norSchema";
import { useVoyageLogic } from "@/hooks/useVoyageLogic";

interface AddNORReportButtonProps {
  onSuccess: () => void;
}

export default function AddNORButton({ onSuccess }: AddNORReportButtonProps) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ***** NEW: State for Vessels List *****
   const { can, isReady } = useAuthorization();

  const getCurrentDateTime = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  // Form State
  // ***** CHANGE: Initial state vesselName set to "AN16" *****
  const [formData, setFormData] = useState({
    vesselName: "",
    vesselId: "",
    voyageNo: "",
    portName: "",
    reportDate: getCurrentDateTime(),
    pilotStation: "",
    norTenderTime: "",
    etaPort: "",
    remarks: "",
  });
  // ✅ 1. CALL THE HOOK
  const { vessels, suggestedVoyageNo } = useVoyageLogic(
    formData.vesselId,
    formData.reportDate
  );
  const [voyageList, setVoyageList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (suggestedVoyageNo !== undefined && suggestedVoyageNo !== formData.voyageNo) {
      setFormData((prev) => ({ ...prev, voyageNo: suggestedVoyageNo }));
    }
  }, [suggestedVoyageNo]);

  // ✅ 4. FETCH & FILTER VOYAGES (Client-Side Firewall)
  useEffect(() => {
    async function fetchAndFilterVoyages() {
      // Stop if no vessel selected
      if (!formData.vesselId) {
        setVoyageList([]);
        return;
      }

      try {
        const res = await fetch(`/api/voyages?vesselId=${formData.vesselId}`);

        if (res.ok) {
          const result = await res.json();
          const allVoyages = Array.isArray(result) ? result : result.data || [];

          // 🔒 STRICT FILTERING LOGIC
          const filtered = allVoyages.filter((v: any) => {
            // Rule 1: STRICTLY match the selected Vessel ID
            const isCorrectVessel =
              (v.vesselId && v.vesselId === formData.vesselId) ||
              (v.vesselName && v.vesselName === formData.vesselName);

            if (!isCorrectVessel) return false;

            // Rule 2: Show if Active OR matches Auto-Suggestion OR matches Current Selection
            const isRelevant =
              v.status === "active" ||
              v.voyageNo === suggestedVoyageNo ||
              v.voyageNo === formData.voyageNo;

            return isRelevant;
          });

          setVoyageList(
            filtered.map((v: any) => ({
              value: v.voyageNo,
              label: `${v.voyageNo} ${v.status !== "active" ? "" : ""}`,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load voyages", error);
        setVoyageList([]);
      }
    }

    fetchAndFilterVoyages();
  }, [formData.vesselId, formData.vesselName, suggestedVoyageNo, formData.voyageNo]);

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle Text Change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr[name];
        return newErr;
      });
    }
  };

  // ***** NEW: Specific handler for the custom Select component *****
 const handleVesselChange = (selectedName: string) => {
    // Find the ID based on the name from the HOOK's vessel list
    const selectedVessel = vessels.find((v) => v.name === selectedName);

    setFormData((prev) => ({ 
        ...prev, 
        vesselName: selectedName,
        vesselId: selectedVessel?._id || "" // 👈 Save ID to trigger hook
    }));

    if (errors.vesselName) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.vesselName;
        return newErr;
      });
    }
  };
  const handleVoyageChange = (val: string) => {
    setFormData((prev) => ({ ...prev, voyageNo: val }));
    if (errors.voyageNo) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.voyageNo;
        return newErr;
      });
    }
  };
  // Handle File Change with 500KB Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file size is > 500KB (500 * 1024 bytes)
      if (file.size > 500 * 1024) {
        setErrors((prev) => ({
          ...prev,
          norDocument: "File size must be below 500 KB.",
        }));
        setSelectedFile(null); // Clear the file state
        e.target.value = ""; // Reset the input UI
        return;
      }

      // If valid, clear error and set file
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.norDocument;
        return newErr;
      });
      setSelectedFile(file);
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    // ***** CHANGE: Reset logic reverts to "AN16" *****
    setFormData({
      vesselName: "",
      voyageNo: "",
      vesselId: "",
      portName: "",
      reportDate: getCurrentDateTime(),
      pilotStation: "",
      norTenderTime: "",
      etaPort: "",
      remarks: "",
    });
    setSelectedFile(null);
    closeModal();
  };

  // FIX: Make 'e' optional and safely check for preventDefault
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    setIsSubmitting(true);

    const validationData = {
      ...formData,
      norDocument: selectedFile, // Add the file state here
    };

    // --- JOI VALIDATION START ---
    const { error } = norSchema.validate(validationData, { abortEarly: false });

    if (error) {
      const newErrors: Record<string, string> = {};
      error.details.forEach((err) => {
        // Map Joi error path to state keys
        if (err.path && err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });

      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }
    // --- JOI VALIDATION END ---

    try {

      const data = new FormData();
      data.append("vesselId", formData.vesselId);
      data.append("vesselName", formData.vesselName);
      data.append("voyageNo", formData.voyageNo);
      data.append("portName", formData.portName);
      data.append(
        "reportDate",
        formData.reportDate ? `${formData.reportDate}+05:30` : ""
      );
      // Match the key expected by backend
      data.append("pilotStation", formData.pilotStation);

      data.append(
        "norTenderTime",
        formData.norTenderTime ? `${formData.norTenderTime}+05:30` : ""
      );
      data.append(
        "etaPort",
        formData.etaPort ? `${formData.etaPort}+05:30` : ""
      );
      data.append("remarks", formData.remarks);

      // Append File if exists
      if (selectedFile) {
        data.append("norDocument", selectedFile);
      }

      // API Call - Using standard operational path
      const response = await fetch("/api/nor", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit NOR");
      }

      toast.success("NOR Record added successfully!");
      onSuccess();
      handleClose();
      router.refresh();
    } catch (error: unknown) {
      // Fix: Use unknown and strict type narrowing instead of any
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add record.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const canCreate = isReady && can("nor.create");

 
  if (!isReady) {
    return null; // or loader
  }

  if (!canCreate) {
    return null;
  }
  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>
        Add NOR
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
          title="Add NOR Record"
          description="Submit Notice of Readiness details and documentation."
          submitLabel={isSubmitting ? "Submitting..." : "Submit NOR Record"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3">
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Reporting Date & Time{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleChange}
                    className={errors.reportDate ? "border-red-500" : ""}
                  />
                  {errors.reportDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.reportDate}
                    </p>
                  )}
                </div>
                
                {/* ***** CHANGED: Using Select for Vessel Name ***** */}
                <div>
                  <Label>
                    Vessel Name <span className="text-red-500">*</span>
                  </Label>
                <SearchableSelect
  options={vessels.map((v) => ({
    value: v.name,
    label: v.name,
  }))}
  placeholder="Search Vessel"
  value={formData.vesselName}
  onChange={(val) => {
    const selected = vessels.find(v => v.name === val);
    setFormData(prev => ({
      ...prev,
      vesselName: val,
      vesselId: selected?._id || "",
      voyageNo: "" // 🔥 reset voyage when vessel changes
    }));
  }}
  className={errors.vesselName ? "border-red-500" : ""}
/>
                  {errors.vesselName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.vesselName}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <Label>
                    Voyage No / ID <span className="text-red-500">*</span>
                  </Label>
                 <SearchableSelect
  options={voyageList}
  placeholder={
    !formData.vesselId
      ? "Select Vessel first"
      : voyageList.length === 0
      ? "No active voyages found"
      : "Search Voyage"
  }
  value={formData.voyageNo}
  onChange={(val) =>
    setFormData(prev => ({ ...prev, voyageNo: val }))
  }
  
  className={errors.voyageNo ? "border-red-500" : ""}
/>


                  {errors.voyageNo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.voyageNo}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Port Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="portName"
                    value={formData.portName}
                    onChange={handleChange}
                    className={errors.portName ? "border-red-500" : ""}
                  />
                  {errors.portName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.portName}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Pilot Station <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="pilotStation"
                    placeholder="Name / position of pilot station"
                    value={formData.pilotStation}
                    onChange={handleChange}
                    className={errors.pilotStation ? "border-red-500" : ""}
                  />
                  {errors.pilotStation && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.pilotStation}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* NOR DETAILS */}
            <ComponentCard title="NOR Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    NOR Tender Time
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    name="norTenderTime"
                    value={formData.norTenderTime}
                    onChange={handleChange}
                    className={errors.norTenderTime ? "border-red-500" : ""}
                  />
                  {errors.norTenderTime && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.norTenderTime}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    ETA Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    name="etaPort"
                    value={formData.etaPort}
                    onChange={handleChange}
                    className={errors.etaPort ? "border-red-500" : ""}
                  />
                  {errors.etaPort && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.etaPort}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label>NOR Document (PDF / Image) - Max 500 KB</Label>

                {/* Pass the error class directly to FileInput */}
                <div>
                  <FileInput
                    className={`w-full ${
                      errors.norDocument
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    onChange={handleFileChange}
                  />
                </div>

                {/* Error message */}
                {errors.norDocument && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.norDocument}
                  </p>
                )}
              </div>
            </ComponentCard>

            {/* REMARKS */}
            <ComponentCard title="Remarks">
              <Label>Remarks</Label>
              <TextArea
                rows={4}
                name="remarks"
                placeholder="Additional notes..."
                value={formData.remarks}
                onChange={handleChange}
                className={errors.remarks ? "border-red-500" : ""}
              />
              {/* Optional error display if you later decide to validate length etc */}
              {errors.remarks && (
                <p className="text-xs text-red-500 mt-1">{errors.remarks}</p>
              )}
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}