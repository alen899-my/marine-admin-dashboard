"use client";

import React, { useState, useMemo, memo, useEffect, forwardRef, useImperativeHandle } from "react";
import { useModal } from "@/hooks/useModal";
import { toast } from "react-toastify";
import Select from "@/components/form/Select";
// UI Components
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import SearchableSelect from "@/components/form/SearchableSelect";

// Validation
import { preArrivalSchema } from "@/lib/validations/preArrival";

interface AddPreArrivalRequestProps {
  onSuccess?: () => void;
  className?: string;
  vesselList: any[]; 
  voyageList: any[];
  editData?: any; // ✅ New prop for editing
}

// ✅ Use forwardRef to allow the parent to open the modal
const AddPreArrivalRequest = forwardRef(({
  onSuccess,
  className,
  vesselList = [],
  voyageList = [],
  editData = null,
}: AddPreArrivalRequestProps, ref) => {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const initialFormState = {
    vesselId: "",
    vesselName: "",
    portName: "",
    voyageId: "", 
    voyageNo: "", 
    requestId: "",
    agentContact: "",
    eta: "",
    dueDate: "",
    notes: "",
    status: "draft",
  };

  const [formData, setFormData] = useState(initialFormState);

  // ✅ Expose open function to parent
  useImperativeHandle(ref, () => ({
    open: () => openModal()
  }));

  // ✅ Populate form when editData is provided
  useEffect(() => {
    if (editData) {
      setFormData({
        vesselId: editData.vesselId?._id || editData.vesselId || "",
        vesselName: editData.vesselId?.name || "",
        portName: editData.portName || "",
        voyageId: editData.voyageId?._id || editData.voyageId || "",
        voyageNo: editData.voyageId?.voyageNo || "",
        requestId: editData.requestId || "",
        agentContact: editData.agentContact || "",
        eta: editData.eta ? new Date(editData.eta).toISOString().slice(0, 16) : "",
        dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().slice(0, 16) : "",
        notes: editData.notes || "",
        status: editData.status || "draft",
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editData, isOpen]);
  const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "published" },
  { value: "sent", label: "Sent to Agent" },
  { value: "completed", label: "Completed" },
];

  const filteredVoyageOptions = useMemo(() => {
    if (!formData.vesselId || !voyageList || voyageList.length === 0) return [];
    return voyageList
      .filter((voy: any) => {
        const voyVesselId = voy.vesselId?._id || voy.vesselId;
        return String(voyVesselId) === String(formData.vesselId);
      })
      .map((voy: any) => ({
        value: voy.voyageNo,
        label: voy.voyageNo,
        id: voy._id
      }));
  }, [formData.vesselId, voyageList]);

  const vesselOptions = useMemo(() => 
    vesselList.map((v: any) => ({
      value: v.name,
      label: v.name,
      id: v._id 
    })), 
  [vesselList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    if (!editData) setFormData(initialFormState);
    closeModal();
  };

 const handleSubmit = async () => {
    setErrors({});

    // 1. Prepare a clean payload. 
    // We explicitly remove voyage fields if they are empty to avoid validation conflicts.
    const payload = {
      vesselId: formData.vesselId,
      vesselName: formData.vesselName,
      status: formData.status,
      portName: formData.portName,
      requestId: formData.requestId,
      agentContact: formData.agentContact,
      eta: formData.eta,
      dueDate: formData.dueDate,
      notes: formData.notes,
      ...(formData.voyageId ? { voyageId: formData.voyageId } : {}),
      ...(formData.voyageNo ? { voyageNo: formData.voyageNo } : {}),
    };

    // 2. Validate the cleaned payload instead of the raw formData
    const validation = preArrivalSchema.validate(payload, { abortEarly: false });
    
    if (validation.error) {
      const joiErrors: Record<string, string> = {};
      validation.error.details.forEach((detail) => {
        const path = detail.path[0] as string;
        joiErrors[path] = detail.message;
      });
      setErrors(joiErrors);
      // Log errors to console so you can see exactly why it's not saving
      console.error("Validation failed:", joiErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editData ? `/api/pre-arrival/${editData._id}` : "/api/pre-arrival";
      const method = editData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send the cleaned payload
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle Request ID conflict specifically
        if (res.status === 409) {
          setErrors({ requestId: data.error });
        }
        toast.error(data.error || "Failed to save request");
        return;
      }

      toast.success(editData ? "Port Request Updated" : "Port Request Created");
      
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
     

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[850px] p-4 sm:p-6 lg:p-8"
      >
        <AddForm
  title={editData ? "Edit Port Call Request" : "Create Port Call Request"}
  description={editData ? "Update existing pre-arrival details." : "Initialize a pre-arrival document pack."}
  submitLabel={isSubmitting ? "Saving..." : editData ? "Update Request" : "Create Request"}
  onCancel={handleClose}
  onSubmit={handleSubmit}
>
  <div className="max-h-[70dvh] overflow-y-auto p-1 custom-scrollbar">
    <ComponentCard title="Port Call Details">
      <div className="space-y-5">
        {/* Row 1: Vessel and Port Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Vessel Name <span className="text-red-500">*</span></Label>
            <SearchableSelect
              options={vesselOptions}
              placeholder="Search Vessel"
              value={formData.vesselName}
              onChange={(val) => {
                const selected = vesselOptions.find((opt) => opt.value === val);
                setFormData((prev) => ({
                  ...prev,
                  vesselName: val,
                  vesselId: selected?.id || "",
                }));
                if (errors.vesselId) setErrors((prev) => ({ ...prev, vesselId: "" }));
              }}
            />
            {errors.vesselId && <p className="text-xs text-red-500 mt-1">{errors.vesselId}</p>}
          </div>
          <div>
            <Label>Port Name <span className="text-red-500">*</span></Label>
            <Input
              name="portName"
              value={formData.portName}
              onChange={handleChange}
              placeholder="e.g. Khor Fakkan, UAE"
              className={errors.portName ? "border-red-500" : ""}
            />
            {errors.portName && <p className="text-xs text-red-500 mt-1">{errors.portName}</p>}
          </div>
        </div>

        {/* Row 2: Request ID and Port Agent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Request ID <span className="text-red-500">*</span></Label>
            <Input 
              name="requestId" 
              value={formData.requestId} 
              onChange={handleChange} 
              placeholder="KF-2026-001" 
              className={errors.requestId ? "border-red-500" : ""}
            />
            {errors.requestId && <p className="text-xs text-red-500 mt-1">{errors.requestId}</p>}
          </div>
          <div>
            <Label>Port Agent</Label>
            <Input 
              name="agentContact" 
              value={formData.agentContact} 
              onChange={handleChange} 
              placeholder="Agency Contact" 
            />
          </div>
        </div>

        {/* Row 3: ETA and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>ETA Arrival <span className="text-red-500">*</span></Label>
            <Input 
              type="datetime-local" 
              name="eta" 
              value={formData.eta} 
              onChange={handleChange} 
              className={errors.eta ? "border-red-500" : ""}
            />
            {errors.eta && <p className="text-xs text-red-500 mt-1">{errors.eta}</p>}
          </div>
          <div>
            <Label>Submission Due Date <span className="text-red-500">*</span></Label>
            <Input 
              type="datetime-local" 
              name="dueDate" 
              value={formData.dueDate} 
              onChange={handleChange} 
              className={errors.dueDate ? "border-red-500" : ""}
            />
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
          </div>
          {editData && (
  <div className="pt-2">
    <Select
      label="Request Status"
      options={statusOptions}
      value={formData.status}
      onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
    />
   
  </div>
)}
        </div>

        {/* Row 4: Notes */}
        <div>
          <Label>Notes </Label>
          <TextArea
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Specific instructions for the ship master..."
          />
        </div>
      </div>
    </ComponentCard>
  </div>
</AddForm>
      </Modal>
    </>
  );
});

export default memo(AddPreArrivalRequest);