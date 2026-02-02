"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import DatePicker from "@/components/form/date-picker"; //  Import DatePicker
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { voyageSchema } from "@/lib/validations/voyageSchema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
interface AddVoyageProps {
  onSuccess?: () => void;
  vesselList: { _id: string; name: string }[];
  className?: string;
}

export default function AddVoyage({
  onSuccess,
  vesselList,
  className,
}: AddVoyageProps) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { can, isReady } = useAuthorization();

  const initialFormState = {
    vesselId: "",
    voyageNo: "",
    status: "scheduled",
    loadPort: "",
    dischargePort: "",
    via: "",
    totalDistance: "",
    chartererName: "",
    charterPartyDate: "",
    laycanStart: "",
    laycanEnd: "",
    commodity: "",
    quantity: "",
    grade: "",
    startDate: "",
    eta: "",
    endDate: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateChange = (name: string, dateStr: string) => {
    setFormData((prev) => ({ ...prev, [name]: dateStr }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    setFormData(initialFormState);
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    const payload = {
      vesselId: formData.vesselId,
      voyageNo: formData.voyageNo,
      status: formData.status,
      route: {
        loadPort: formData.loadPort,
        dischargePort: formData.dischargePort,
        via: formData.via,
        totalDistance: formData.totalDistance
          ? Number(formData.totalDistance)
          : 0,
      },
      charter: {
        chartererName: formData.chartererName,
        charterPartyDate: formData.charterPartyDate,
        laycanStart: formData.laycanStart,
        laycanEnd: formData.laycanEnd,
      },
      cargo: {
        commodity: formData.commodity,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        grade: formData.grade,
      },
      schedule: {
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        eta: formData.eta ? new Date(formData.eta) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      },
    };

    const validation = voyageSchema.validate(payload, { abortEarly: false });

    if (validation.error) {
      const joiErrors: Record<string, string> = {};
      validation.error.details.forEach((detail) => {
        const pathKey = detail.path[detail.path.length - 1].toString();
        joiErrors[pathKey] = detail.message;
      });
      setErrors(joiErrors);
      toast.error("Please fix the highlighted errors");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/voyages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((e: { field: string; message: string }) => {
            const fieldName = e.field.split(".").pop() || e.field;
            fieldErrors[fieldName] = e.message;
          });
          setErrors(fieldErrors);
          toast.error("Please fix the highlighted errors");
        } else {
          toast.error(data?.error || "Failed to add voyage");
        }
        return;
      }

      toast.success("Voyage added successfully");
      router.refresh();
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error("Voyage submit failed", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("voyage.create");

  if (!isReady) return null;
  if (!canCreate) return null;

  return (
    <>
      <Button
        size="md"
        variant="primary"
        className={className}
        onClick={openModal}
      >
        Create Voyage
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[720px] lg:max-w-[900px] p-4 sm:p-6 lg:p-8"
      >
        <AddForm
          title="Create New Voyage"
          description="Enter voyage details, route, and schedule information."
          submitLabel={isSubmitting ? "Creating..." : "Create Voyage"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3">
            {/* 1. GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Vessel <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={vesselList.map((v) => ({
                      value: v._id,
                      label: v.name,
                    }))}
                    value={formData.vesselId}
                    onChange={(val) => handleSelectChange("vesselId", val)}
                    placeholder="Search and Select Vessel"
                    error={!!errors.vesselId} // Displays red border if error exists
                  />
                  {errors.vesselId && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.vesselId}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Voyage Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="voyageNo"
                    value={formData.voyageNo}
                    onChange={handleChange}
                    className={errors.voyageNo ? "border-red-500" : ""}
                    placeholder="e.g. VOY-2024-001"
                  />
                  {errors.voyageNo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.voyageNo}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "scheduled", label: "Scheduled" },
                      { value: "active", label: "Active" },
                      { value: "completed", label: "Completed" },
                    ]}
                    value={formData.status}
                    onChange={(val) => handleSelectChange("status", val)}
                    placeholder="Select Status"
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 2. ROUTE DETAILS */}
            <ComponentCard title="Route Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Load Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="loadPort"
                    value={formData.loadPort}
                    onChange={handleChange}
                    placeholder="e.g. Singapore"
                    className={errors.loadPort ? "border-red-500" : ""}
                  />
                  {errors.loadPort && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.loadPort}
                    </p>
                  )}
                </div>
                <div>
                  <Label>
                    Discharge Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="dischargePort"
                    value={formData.dischargePort}
                    onChange={handleChange}
                    placeholder="e.g. Rotterdam"
                    className={errors.dischargePort ? "border-red-500" : ""}
                  />
                  {errors.dischargePort && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.dischargePort}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Label>Via (Optional)</Label>
                  <Input
                    name="via"
                    value={formData.via}
                    onChange={handleChange}
                    placeholder="e.g. Suez Canal"
                  />
                </div>
                <div>
                  <Label>Total Distance (NM)</Label>
                  <Input
                    type="number"
                    name="totalDistance"
                    value={formData.totalDistance}
                    onChange={handleChange}
                    placeholder="e.g. 8500"
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 3. SCHEDULE (Keeping DateTime inputs here as requested) */}
            <ComponentCard title="Schedule">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                     className={errors.startDate ? "border-red-500" : ""}
                  />
                    {errors.startDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label>ETA (Estimated Arrival)</Label>
                  <Input
                    type="datetime-local"
                    name="eta"
                    value={formData.eta}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 4. CHARTER PARTY ( Updated with DatePicker) */}
            <ComponentCard title="Charter Party Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Charterer Name</Label>
                  <Input
                    name="chartererName"
                    value={formData.chartererName}
                    onChange={handleChange}
                    placeholder="e.g. Global Oil Trading Ltd."
                  />
                </div>

                {/* CP Date */}
                <div>
                  <Label>CP Date</Label>
                  <DatePicker
                    id="cp-date"
                    placeholder="Select Date"
                    defaultDate={formData.charterPartyDate}
                    onChange={(_, dateStr) =>
                      handleDateChange("charterPartyDate", dateStr)
                    }
                    className={errors.charterPartyDate ? "border-red-500" : ""}
                  />
                </div>

                {/* Laycan Start */}
                <div>
                  <Label>Laycan Start</Label>
                  <DatePicker
                    id="laycan-start"
                    placeholder="Select Date"
                    defaultDate={formData.laycanStart}
                    onChange={(_, dateStr) =>
                      handleDateChange("laycanStart", dateStr)
                    }
                    className={errors.laycanStart ? "border-red-500" : ""}
                  />
                </div>

                {/* Laycan End */}
                <div>
                  <Label>Laycan End</Label>
                  <DatePicker
                    id="laycan-end"
                    placeholder="Select Date"
                    defaultDate={formData.laycanEnd}
                    onChange={(_, dateStr) =>
                      handleDateChange("laycanEnd", dateStr)
                    }
                    className={errors.laycanEnd ? "border-red-500" : ""}
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 5. CARGO */}
            <ComponentCard title="Cargo Information">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <Label>Commodity</Label>
                  <Input
                    name="commodity"
                    value={formData.commodity}
                    onChange={handleChange}
                    placeholder="e.g. Crude Oil"
                  />
                </div>
                <div>
                  <Label>Quantity (MT)</Label>
                  <Input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 150000"
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    placeholder="e.g. Brent Blend"
                  />
                </div>
              </div>
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
