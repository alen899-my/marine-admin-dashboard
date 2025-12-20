"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select"; // Added Select Import
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { useState, useEffect } from "react"; // Added useEffect
import { toast } from "react-toastify";

interface AddDepartureReportButtonProps {
  onSuccess: () => void;
}

// Define interface for API error details
interface APIErrorDetail {
  field: string;
  message: string;
}

export default function AddDepartureReportButton({
  onSuccess,
}: AddDepartureReportButtonProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isOpen, openModal, closeModal } = useModal();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ***** NEW: State for Vessels List *****
  const [vessels, setVessels] = useState<{ _id: string; name: string }[]>([]);

  // ***** NEW: Fetch Vessels from DB *****
  useEffect(() => {
    async function fetchVessels() {
      try {
        const res = await fetch("/api/vessels");
        if (res.ok) {
          const data = await res.json();
          setVessels(data);
        }
      } catch (err) {
        console.error("Error loading vessels:", err);
      }
    }
    fetchVessels();
  }, []);

  const getCurrentDateTime = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  // ***** CHANGE: Initial state vesselName set to "AN16" *****
  const [formData, setFormData] = useState({
    vesselName: "AN16",
    voyageId: "",
    portName: "",
    eventTime: "",
    reportDate: getCurrentDateTime(),
    distanceToGo: "",
    etaNextPort: "",
    robVlsfo: "",
    robLsmgo: "",
    cargoSummary: "",
    remarks: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ***** NEW: Specific handler for the custom Select component *****
  const handleVesselChange = (value: string) => {
    setFormData((prev) => ({ ...prev, vesselName: value }));
    if (errors.vesselName) {
      setErrors((prev) => ({ ...prev, vesselName: "" }));
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);

    // ***** CHANGE: Reset logic reverts to "AN16" *****
    setFormData({
      vesselName: "AN16",
      voyageId: "",
      portName: "",
      eventTime: "",
      reportDate: getCurrentDateTime(),
      distanceToGo: "",
      etaNextPort: "",
      robVlsfo: "",
      robLsmgo: "",
      cargoSummary: "",
      remarks: "",
    });

    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({}); // clear old errors

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/departure-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselName: formData.vesselName,
          voyageId: formData.voyageId,
          portName: formData.portName,

          // ***** CHANGE: Append +05:30 to tell server this is IST *****
          eventTime: formData.eventTime ? `${formData.eventTime}+05:30` : null,

          // ***** CHANGE: Append +05:30 to tell server this is IST *****
          reportDate: formData.reportDate
            ? `${formData.reportDate}+05:30`
            : null,

          distanceToGo:
            formData.distanceToGo === ""
              ? undefined
              : Number(formData.distanceToGo),

          // ***** CHANGE: Append +05:30 to tell server this is IST *****
          etaNextPort: formData.etaNextPort
            ? `${formData.etaNextPort}+05:30`
            : null,

          robVlsfo:
            formData.robVlsfo === "" ? undefined : Number(formData.robVlsfo),
          robLsmgo:
            formData.robLsmgo === "" ? undefined : Number(formData.robLsmgo),

          cargoSummary: formData.cargoSummary,
          remarks: formData.remarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.details) {
          const fieldErrors: Record<string, string> = {};
          // Fixed: Use typed interface instead of any
          data.details.forEach((e: APIErrorDetail) => {
            fieldErrors[e.field] = e.message;
          });
          setErrors(fieldErrors);

          toast.error("Please fix the highlighted errors");
        } else {
          toast.error(data?.error || "Failed to submit departure report");
        }

        return;
      }
      toast.success("Departure report submitted successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to submit departure report", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* OPEN MODAL BUTTON */}
      <Button size="md" variant="primary" onClick={openModal}>
        Add Departure Report
      </Button>

      {/* MODAL */}
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
          title="Add Departure Report"
          description="Simple data collection form for departure details and ROB."
          submitLabel={
            isSubmitting ? "Submitting..." : "Submit Departure Report"
          }
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
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
                  <Select
                    options={vessels.map((v) => ({
                      value: v.name,
                      label: v.name,
                    }))}
                    placeholder="Select Vessel"
                    value={formData.vesselName}
                    onChange={handleVesselChange}
                    className={errors.vesselName ? "border-red-500" : ""}
                  />
                  {errors.vesselName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.vesselName}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Voyage No / ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="voyageId"
                    value={formData.voyageId}
                    onChange={handleChange}
                    className={errors.voyageId ? "border-red-500" : ""}
                  />
                  {errors.voyageId && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.voyageId}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Port Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
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
                    RFA Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleChange}
                    className={errors.eventTime ? "border-red-500" : ""}
                  />
                  {errors.eventTime && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.eventTime}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* VOYAGE DETAILS */}
            <ComponentCard title="Voyage Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Distance to Go (NM) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="distanceToGo"
                    value={formData.distanceToGo}
                    onChange={handleChange}
                    className={errors.distanceToGo ? "border-red-500" : ""}
                  />
                  {errors.distanceToGo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.distanceToGo}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    ETA Next Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    name="etaNextPort"
                    value={formData.etaNextPort}
                    onChange={handleChange}
                    className={errors.etaNextPort ? "border-red-500" : ""}
                  />
                  {errors.etaNextPort && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.etaNextPort}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* ROB */}
            <ComponentCard title="ROB at Departure">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    ROB - VLSFO (MT) <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    ROB - LSMGO (MT) <span className="text-red-500">*</span>
                  </Label>
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

            {/* CARGO */}
            <ComponentCard title="Cargo Details">
              <Label>
                Cargo Loaded / Unloaded <span className="text-red-500">*</span>
              </Label>
              <TextArea
                name="cargoSummary"
                rows={4}
                className={errors.cargoSummary ? "border-red-500" : ""}
                placeholder="Brief description of cargo loaded/ unloaded, grades and quantities if required."
                value={formData.cargoSummary}
                onChange={handleChange}
              />
              {errors.cargoSummary && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.cargoSummary}
                </p>
              )}
            </ComponentCard>

            {/* REMARKS */}
            <ComponentCard title="Remarks">
              <Label>Remarks</Label>
              <TextArea
                name="remarks"
                rows={4}
                className={errors.remarks ? "border-red-500" : ""}
                placeholder="Any additional notes related to departure, pilotage, delays, instructions, etc."
                value={formData.remarks}
                onChange={handleChange}
              />
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