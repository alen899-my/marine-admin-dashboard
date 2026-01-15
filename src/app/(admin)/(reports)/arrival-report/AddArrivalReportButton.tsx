"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { useVoyageLogic } from "@/hooks/useVoyageLogic";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";

interface AddArrivalReportButtonProps {
  onSuccess: () => void;
  vesselList: any[];
  allVoyages: any[]; // ✅ Added from parent
}

export default function AddArrivalReportButton({
  onSuccess,
  vesselList,
  allVoyages, // ✅ Destructured
}: AddArrivalReportButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { can, isReady } = useAuthorization();
  const [norSameAsArrival, setNorSameAsArrival] = useState(true);

  const getCurrentDateTime = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  const [formData, setFormData] = useState({
    vesselName: "",
    vesselId: "", 
    voyageId: "",
    portName: "",
    reportDate: getCurrentDateTime(),
    arrivalTime: "",
    norTime: "",
    arrivalCargoQty: "",
    robVlsfo: "",
    robLsmgo: "",
    remarks: "",
  });

  // ✅ 1. SUGGESTION HOOK
  const { suggestedVoyageNo } = useVoyageLogic(
    formData.vesselId || undefined,
    formData.reportDate
  );

  // ✅ 2. NEW: Local Filter Logic (Replaces the manual fetch useEffect)
const filteredVoyageOptions = useMemo(() => {
    if (!formData.vesselId) return [];

    const options = allVoyages
      .filter((v: any) => v.vesselId?.toString() === formData.vesselId?.toString())
      .map((v: any) => ({
        value: v.voyageNo,
        label: v.voyageNo,
      }));

    // Fallback to ensure suggested voyage is always selectable/visible
    if (suggestedVoyageNo && !options.some(opt => opt.value === suggestedVoyageNo)) {
      options.unshift({
        value: suggestedVoyageNo,
        label: suggestedVoyageNo,
      });
    }

    return options;
  }, [formData.vesselId, allVoyages, suggestedVoyageNo]);

  // ✅ 3. SYNC Suggested Voyage
  useEffect(() => {
    if (suggestedVoyageNo && suggestedVoyageNo !== formData.voyageId) {
      setFormData((prev) => ({ ...prev, voyageId: suggestedVoyageNo }));
    }
  }, [suggestedVoyageNo]);

  // ✅ 4. SYNC NOR Time with Arrival Time
  useEffect(() => {
    if (norSameAsArrival && formData.arrivalTime) {
      setFormData((prev) => ({ ...prev, norTime: formData.arrivalTime }));
    }
  }, [norSameAsArrival, formData.arrivalTime]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleVesselChange = (selectedName: string) => {
    const selectedVessel = vesselList.find((v: any) => v.name === selectedName);
    setFormData((prev) => ({
      ...prev,
      vesselName: selectedName,
      vesselId: selectedVessel?._id || "",
      voyageId: "", // Reset voyage when vessel changes to trigger new suggestion
    }));
    if (errors.vesselName) setErrors((prev) => ({ ...prev, vesselName: "" }));
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData({
      vesselName: "",
      voyageId: "",
      vesselId: "",
      portName: "",
      reportDate: getCurrentDateTime(),
      arrivalTime: "",
      norTime: "",
      arrivalCargoQty: "",
      robVlsfo: "",
      robLsmgo: "",
      remarks: "",
    });
    setNorSameAsArrival(true);
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
          vesselId: formData.vesselId,
          vesselName: formData.vesselName,
          voyageId: formData.voyageId,
          portName: formData.portName,
          reportDate: formData.reportDate ? `${formData.reportDate}+05:30` : "",
          arrivalTime: formData.arrivalTime ? `${formData.arrivalTime}+05:30` : "",
          norTime: formData.norTime ? `${formData.norTime}+05:30` : "",
          arrivalCargoQty: formData.arrivalCargoQty === "" ? undefined : Number(formData.arrivalCargoQty),
          robVlsfo: formData.robVlsfo === "" ? undefined : Number(formData.robVlsfo),
          robLsmgo: formData.robLsmgo === "" ? undefined : Number(formData.robLsmgo),
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

  const canCreate = isReady && can("arrival.create");

  if (!isReady || !canCreate) {
    return null;
  }
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
          submitLabel={isSubmitting ? "Submitting..." : "Submit Arrival Report"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3">
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Reporting Date & Time<span className="text-red-500">*</span>
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
                   options={vesselList.map((v: any) => ({ // ⚡ Use 'vesselList' prop
    value: v.name,
    label: v.name,
  }))}
                    placeholder="Select or search Vessel"
                    value={formData.vesselName}
                    onChange={handleVesselChange}
                    className={errors.vesselName ? "border-red-500" : ""}
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
                   options={filteredVoyageOptions}
                    placeholder={
                      !formData.vesselId
                        ? "Select Vessel first"
                        : filteredVoyageOptions.length === 0
                        ? "No active voyages found"
                        : "Search Voyage"
                    }
                    value={formData.voyageId}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, voyageId: val }));
                      if (errors.voyageId) {
                        setErrors((prev) => ({ ...prev, voyageId: "" }));
                      }
                    }}
                    className={errors.voyageId ? "border-red-500" : ""}
                     error={!!errors.voyageId}
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
              </div>
            </ComponentCard>

            {/* ARRIVAL TIMES & CARGO */}
            <ComponentCard title="Arrival & NOR Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Arrival Time <span className="text-red-500">*</span>
                  </Label>
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

                <div>
                  <Label>
                    Cargo on Board at Arrival (MT){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="arrivalCargoQty"
                    placeholder="e.g. 25000"
                    value={formData.arrivalCargoQty}
                    onChange={handleChange}
                    className={errors.arrivalCargoQty ? "border-red-500" : ""}
                  />
                  {errors.arrivalCargoQty && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.arrivalCargoQty}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>
                      NOR Time <span className="text-red-500">*</span>
                    </Label>
                    <Checkbox
                      id="norSync"
                      label="Same as Arrival"
                      checked={norSameAsArrival}
                      onChange={(checked) => setNorSameAsArrival(checked)}
                      variant="default"
                    />
                  </div>
                  <Input
                    type="datetime-local"
                    name="norTime"
                    value={formData.norTime}
                    onChange={handleChange}
                    disabled={norSameAsArrival}
                    className={`${errors.norTime ? "border-red-500" : ""} ${
                      norSameAsArrival ? "bg-gray-50 opacity-80" : ""
                    }`}
                  />
                  {errors.norTime && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.norTime}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* ROB */}
            <ComponentCard title="ROB on Arrival">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Arrival ROB - VLSFO (MT){" "}
                    <span className="text-red-500">*</span>
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
                    Arrival ROB - LSMGO (MT){" "}
                    <span className="text-red-500">*</span>
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
