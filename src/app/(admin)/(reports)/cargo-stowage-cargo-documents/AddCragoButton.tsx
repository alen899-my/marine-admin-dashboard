"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import FileInput from "@/components/form/input/FileInput";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { cargoSchema } from "@/lib/validations/cargoValidation";
import { useEffect, useState } from "react"; // Added useEffect
import { toast } from "react-toastify";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useVoyageLogic } from "@/hooks/useVoyageLogic";
import SearchableSelect from "@/components/form/SearchableSelect";
interface AddCargoReportButtonProps {
  onSuccess: () => void;
}

export default function AddCargoButton({
  onSuccess,
}: AddCargoReportButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [voyageList, setVoyageList] = useState<
    { value: string; label: string }[]
  >([]);
  const { can, isReady } = useAuthorization();

  // Form State
  const getCurrentDateTime: () => string = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  const [formData, setFormData] = useState({
    vesselName: "", // ✅ CHANGE: Default to AN16
    voyageNo: "",
    vesselId: "",
    portName: "",
    reportDate: getCurrentDateTime(),
    portType: "",
    documentType: "",
    documentDate: "",
    remarks: "",
  });

  const { vessels, suggestedVoyageNo } = useVoyageLogic(
    formData.vesselId,
    formData.reportDate
  );

  // ✅ 4. SYNC LOGIC (Auto-fill Voyage)
  useEffect(() => {
    // Check if suggestion exists (even empty string) and is different
    if (
      suggestedVoyageNo !== undefined &&
      suggestedVoyageNo !== formData.voyageNo
    ) {
      if (suggestedVoyageNo) {
        setFormData((prev) => ({ ...prev, voyageNo: suggestedVoyageNo }));
      }
    }
  }, [suggestedVoyageNo]);
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
  }, [
    formData.vesselId,
    formData.vesselName,
    suggestedVoyageNo,
    formData.voyageNo,
  ]);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handleVesselChange = (value: string) => {
    // Find the ID based on the name from the HOOK's vessel list
    const selectedVessel = vessels.find((v) => v.name === value);

    setFormData((prev) => ({
      ...prev,
      vesselName: value,
      vesselId: selectedVessel?._id || "", // 👈 Save ID to trigger hook
    }));

    if (errors.vesselName) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.vesselName;
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
    // 1. Check if the file list is empty (User removed the file)
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setErrors((prev) => ({ ...prev, file: "File is required" }));
      return;
    }

    const file = e.target.files[0];

    // 2. Check size (500 KB)
    if (file.size > 500 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: "File size must be below 500 KB.",
      }));
      setSelectedFile(null);
      e.target.value = ""; // Reset input
      return;
    }

    // 3. Valid File Selected
    setSelectedFile(file);

    // Clear error if it exists
    if (errors.file) {
      setErrors((prev) => {
        const newErr = { ...prev };
        delete newErr.file;
        return newErr;
      });
    }
  };
  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData({
      vesselName: "AN16", // ✅ CHANGE: Reset to AN16
      voyageNo: "",
      vesselId: "",
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
    // 2. Joi Validation Logic

    // Validate the text fields using Joi
    const { error } = cargoSchema.validate(formData, { abortEarly: false });

    // Create an object to hold any found errors
    const newErrors: Record<string, string> = {};

    // If Joi found errors, map them to your newErrors object
    if (error) {
      error.details.forEach((err) => {
        // err.path[0] is the field name (e.g., 'vesselName')
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
    }

    // 3. Manual Check for File
    // (Joi is best for JSON data, so we keep the file check manual to ensure logic doesn't break)
    if (!selectedFile) {
      newErrors.file = "File is required";
    }

    // 4. Block submission if there are any errors
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
      payload.append("vesselId", formData.vesselId);
      payload.append("voyageNo", formData.voyageNo);
      payload.append(
        "reportDate",
        formData.reportDate ? `${formData.reportDate}+05:30` : ""
      );
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
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  const canCreate = isReady && can("cargo.create");

  if (!isReady) {
    return null; // or loader
  }

  if (!canCreate) {
    return null;
  }

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
              const selectedVessel = vessels.find((v) => v.name === val);
              setFormData((prev) => ({
                ...prev,
                vesselName: val,
                vesselId: selectedVessel?._id || "",
                voyageNo: "",
              }));
              // ✅ Clear error immediately on change
              if (errors.vesselName) setErrors(prev => ({ ...prev, vesselName: "" }));
            }}
            // ✅ Trigger the custom red border logic
            error={!!errors.vesselName}
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
            onChange={(val) => {
              handleVoyageChange(val);
              if (errors.voyageNo) setErrors(prev => ({ ...prev, voyageNo: "" }));
            }}
            // ✅ Trigger the custom red border logic
            error={!!errors.voyageNo}
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
                    Port Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Select
                      options={portTypeOptions}
                      placeholder="Select Port Type"
                      value={formData.portType}
                      onChange={(val) => handleSelectChange("portType", val)}
                      className={`${
                        errors.portType ? "border-red-500" : ""
                      } dark:bg-dark-900`}
                    />
                  </div>
                  {errors.portType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.portType}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* DOCUMENT TYPE & UPLOAD */}
            <ComponentCard title="Document Type & Upload">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Document Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Select
                      options={docTypeOptions}
                      placeholder="Select Type"
                      value={formData.documentType}
                      onChange={(val) =>
                        handleSelectChange("documentType", val)
                      }
                      className={`${
                        errors.documentType ? "border-red-500" : ""
                      } dark:bg-dark-900`}
                    />
                  </div>
                  {errors.documentType && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.documentType}
                    </p>
                  )}
                </div>

                <div>
                  <DatePicker
                    id="document-date"
                    label="Document Date"
                    placeholder="Select a date"
                    onChange={handleDateChange}
                    className={
                      errors.documentDate
                        ? "border border-red-500 rounded-lg"
                        : ""
                    }
                  />
                  {errors.documentDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.documentDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label>
                  Upload File (PDF / Image / Excel) - Max 500 KB{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <FileInput
                  className={`w-full ${
                    errors.file ? "border-red-500 focus:border-red-500" : ""
                  }`}
                  onChange={handleFileChange}
                />
                {errors.file && (
                  <p className="text-xs text-red-500 mt-1">{errors.file}</p>
                )}
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
