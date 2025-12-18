"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useState } from "react";
import { toast } from "react-toastify";

interface AddArrivalReportButtonProps {
  onSuccess: () => void;
}

export default function AddArrivalReportButton({onSuccess}: AddArrivalReportButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ HELPER: Get Current Date/Time in 'YYYY-MM-DDThh:mm' format
  const getCurrentDateTime = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  const [formData, setFormData] = useState({
    vesselName: "",
    voyageId: "",
    portName: "",
    reportDate: getCurrentDateTime(), // ✅ NEW: Auto-populate default
    arrivalTime: "",
    robVlsfo: "",
    robLsmgo: "",
    remarks: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData({
      vesselName: "",
      voyageId: "",
      portName: "",
      reportDate: getCurrentDateTime(), // ✅ NEW: Reset to current time
      arrivalTime: "",
      robVlsfo: "",
      robLsmgo: "",
      remarks: "",
    });
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/arrival-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselName: formData.vesselName,
          voyageId: formData.voyageId,
          portName: formData.portName,
         reportDate: formData.reportDate ? `${formData.reportDate}+05:30` : "",
          arrivalTime: formData.arrivalTime ? `${formData.arrivalTime}+05:30` : "",
          robVlsfo:
            formData.robVlsfo === "" ? undefined : Number(formData.robVlsfo),
          robLsmgo:
            formData.robLsmgo === "" ? undefined : Number(formData.robLsmgo),
          remarks: formData.remarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((e: { field: string; message: string }) => {
            fieldErrors[e.field] = e.message;
          });
          setErrors(fieldErrors);
          toast.error("Please fix the highlighted errors");
        } else {
          toast.error(data?.error || "Failed to submit arrival report");
        }
        return;
      }

      toast.success("Arrival report submitted successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Arrival report submit failed", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>
        Add Arrival Report
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
          title="Add Arrival Report"
          description="Simple data collection form for arrival time and ROB on arrival."
          submitLabel={
            isSubmitting ? "Submitting..." : "Submit Arrival Report"
          }
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                <div>
                  <Label>Reporting Date & Time<span className="text-red-500">*</span></Label>
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
                  {errors.vesselName && (
                    <p className="text-xs text-red-500 mt-1">{errors.vesselName}</p>
                  )}
                </div>

                <div>
                  <Label>Voyage No / ID <span className="text-red-500">*</span></Label>
                  <Input
                    name="voyageId"
                    value={formData.voyageId}
                    onChange={handleChange}
                    className={errors.voyageId ? "border-red-500" : ""}
                  />
                  {errors.voyageId && (
                    <p className="text-xs text-red-500 mt-1">{errors.voyageId}</p>
                  )}
                </div>

                <div>
                  <Label>Port Name <span className="text-red-500">*</span></Label>
                  <Input
                    name="portName"
                    value={formData.portName}
                    onChange={handleChange}
                    className={errors.portName ? "border-red-500" : ""}
                  />
                  {errors.portName && (
                    <p className="text-xs text-red-500 mt-1">{errors.portName}</p>
                  )}
                </div>

                <div>
                  <Label>Arrival Time <span className="text-red-500">*</span></Label>
                  <Input
                    type="datetime-local"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className={errors.arrivalTime ? "border-red-500" : ""}
                  />
                  {errors.arrivalTime && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.arrivalTime}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* ROB */}
            <ComponentCard title="ROB on Arrival">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Arrival ROB - VLSFO (MT) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    name="robVlsfo"
                    value={formData.robVlsfo}
                    onChange={handleChange}
                    className={errors.robVlsfo ? "border-red-500" : ""}
                  />
                  {errors.robVlsfo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.robVlsfo}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Arrival ROB - LSMGO (MT) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    name="robLsmgo"
                    value={formData.robLsmgo}
                    onChange={handleChange}
                    className={errors.robLsmgo ? "border-red-500" : ""}
                  />
                  {errors.robLsmgo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.robLsmgo}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* REMARKS */}
            <ComponentCard title="Remarks">
              <Label>Remarks</Label>
              <TextArea
                name="remarks"
                rows={4}
                value={formData.remarks}
                onChange={handleChange}
                className={errors.remarks ? "border-red-500" : ""}
                placeholder="Any notes related to arrival, delays, waiting at anchorage, pilotage, etc."
              />
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}