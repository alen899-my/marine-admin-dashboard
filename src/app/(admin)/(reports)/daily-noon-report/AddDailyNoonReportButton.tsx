"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

import { useAuthorization } from "@/hooks/useAuthorization";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { Info } from "lucide-react";
interface AddDailyNoonReportButtonProps {
  onSuccess: () => void;
}

// Defined interface for the error details to avoid 'any'
interface APIErrorDetail {
  field: string;
  message: string;
}

export default function AddDailyNoonReportButton({
  onSuccess,
}: AddDailyNoonReportButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { can, isReady } = useAuthorization();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // ***** NEW: State for Vessels List *****
  const [vessels, setVessels] = useState<{ _id: string; name: string }[]>([]);

  // ***** CHANGE: Get Current Time in IST for default value *****
  const getCurrentDateTime = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  const [form, setForm] = useState({
    vesselName: "AN16",
    voyageNo: "",
    reportDate: getCurrentDateTime(),
    nextPort: "",
    latitude: "",
    longitude: "",
    distanceTravelled: "", // This is Observed Distance (nm)
    engineDistance: "", // ***** NEW FIELD *****
    slip: "", // ***** NEW FIELD (Auto-calculated) *****
    distanceToGo: "",
    vlsfoConsumed: "", // Last 24h VLSFO
    lsmgoConsumed: "", // Last 24h LSMGO
    windForce: "",
    seaState: "",
    weatherRemarks: "",
    generalRemarks: "",
  });

  // ***** NEW: Auto-calculate Slip whenever distances change *****
  useEffect(() => {
    const engineDist = parseFloat(form.engineDistance);
    const obsDist = parseFloat(form.distanceTravelled);

    if (!isNaN(engineDist) && engineDist !== 0 && !isNaN(obsDist)) {
      const calculatedSlip = ((engineDist - obsDist) / engineDist) * 100;
      setForm((prev) => ({ ...prev, slip: calculatedSlip.toFixed(2) }));
    } else if (engineDist === 0 || isNaN(engineDist)) {
      setForm((prev) => ({ ...prev, slip: "" }));
    }
  }, [form.engineDistance, form.distanceTravelled]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const resetForm = () => {
    setForm({
      vesselName: "AN16",
      voyageNo: "",
      reportDate: getCurrentDateTime(),
      nextPort: "",
      latitude: "",
      longitude: "",
      distanceTravelled: "",
      engineDistance: "",
      slip: "",
      distanceToGo: "",
      vlsfoConsumed: "",
      lsmgoConsumed: "",
      windForce: "",
      seaState: "",
      weatherRemarks: "",
      generalRemarks: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      // ***** CHANGE: Append +05:30 to reportDate to lock it to IST *****
      const payload = {
        ...form,
        reportDate: form.reportDate ? `${form.reportDate}+05:30` : null,
      };

      const res = await fetch("/api/noon-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          // Fixed: Use APIErrorDetail interface instead of any
          data.details.forEach((err: APIErrorDetail) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
          toast.error("Please fix highlighted errors");
        } else {
          toast.error(data.error || "Failed to submit noon report");
        }
        return;
      }

      toast.success("Daily Noon Report submitted successfully!");
      onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ***** NEW: Fetch Vessels on Mount *****
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

  // Handler for custom Select component
  const handleVesselChange = (value: string) => {
    setForm((prev) => ({ ...prev, vesselName: value }));

    // Clear error if it exists
    if (errors.vesselName) {
      setErrors((prev) => ({ ...prev, vesselName: "" }));
    }
  };
  // 2️⃣ DERIVED VALUES (SAFE NOW)
  const canCreate = isReady && can("noon.create");

  // 3️⃣ EARLY RETURNS (AFTER ALL HOOKS)
  if (!isReady) {
    return null; // or loader
  }

  if (!canCreate) {
    return null;
  }
  return (
    <>
      <Button size="md" variant="primary" onClick={openModal}>
        Add Daily Noon Report
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
          title="Add Daily Noon Report"
          description="Simple data collection form for daily noon position and consumption reports."
          submitLabel={isSubmitting ? "Submitting..." : "Submit Noon Report"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3">
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Report Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    name="reportDate"
                    value={form.reportDate}
                    onChange={handleChange}
                    className={errors.reportDate ? "border-red-500" : ""}
                  />
                  {errors.reportDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.reportDate}
                    </p>
                  )}
                </div>

                {/* ***** CHANGED: Vessel Name Select ***** */}
                <div>
                  <Label>
                    Vessel Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    options={vessels.map((v) => ({
                      value: v.name, // Using name as value since your form state expects string name
                      label: v.name,
                    }))}
                    placeholder="Select Vessel"
                    value={form.vesselName}
                    onChange={handleVesselChange}
                    className={errors.vesselName ? "border-red-500" : ""}
                  />
                  {errors.vesselName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.vesselName}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Voyage No / ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="voyageNo"
                    value={form.voyageNo}
                    onChange={handleChange}
                    className={errors.voyageNo ? "border-red-500" : ""}
                  />
                  {errors.voyageNo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.voyageNo}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Next Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="nextPort"
                    value={form.nextPort}
                    onChange={handleChange}
                    className={errors.nextPort ? "border-red-500" : ""}
                  />
                  {errors.nextPort && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nextPort}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* POSITION & DISTANCE */}
            <ComponentCard title="Position & Distance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Latitude <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="latitude"
                    placeholder="e.g. 24°30.5' N"
                    value={form.latitude}
                    onChange={handleChange}
                    className={errors.latitude ? "border-red-500" : ""}
                  />
                  {errors.latitude && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.latitude}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Longitude <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="longitude"
                    placeholder="e.g. 054°22.7' E"
                    value={form.longitude}
                    onChange={handleChange}
                    className={errors.longitude ? "border-red-500" : ""}
                  />
                  {errors.longitude && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.longitude}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Observed Distance (NM){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="distanceTravelled"
                    placeholder="Distance over ground"
                    value={form.distanceTravelled}
                    onChange={handleChange}
                    className={errors.distanceTravelled ? "border-red-500" : ""}
                  />
                  {errors.distanceTravelled && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.distanceTravelled}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Engine Distance (NM) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="engineDistance"
                    placeholder="Log distance through water"
                    value={form.engineDistance}
                    onChange={handleChange}
                    className={errors.engineDistance ? "border-red-500" : ""}
                  />
                  {errors.engineDistance && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.engineDistance}
                    </p>
                  )}
                </div>

                <div>
  <Label className="flex items-center gap-1">
    Slip (%) <span className="text-red-500">*</span>

    <Tooltip
      position="right"
      content="Slip (%) = ((Engine Distance − Observed Distance) / Engine Distance) × 100"
    >
      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-zinc-400 dark:text-gray-500">
        <Info/>
      </span>
    </Tooltip>
  </Label>

  <Input
    type="number"
    name="slip"
    placeholder="Calculated or manual"
    value={form.slip}
    onChange={handleChange}
    className={errors.slip ? "border-red-500" : ""}
  />

  {errors.slip && (
    <p className="text-red-500 text-xs mt-1">{errors.slip}</p>
  )}
</div>


                <div>
                  <Label>
                    Distance To Go (NM) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="distanceToGo"
                    value={form.distanceToGo}
                    onChange={handleChange}
                    className={errors.distanceToGo ? "border-red-500" : ""}
                  />
                  {errors.distanceToGo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.distanceToGo}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* FUEL */}
            <ComponentCard title="Last 24 hrs fuel consumed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Fuel 24h - VLSFO (MT){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="vlsfoConsumed"
                    value={form.vlsfoConsumed}
                    onChange={handleChange}
                    className={errors.vlsfoConsumed ? "border-red-500" : ""}
                  />
                  {errors.vlsfoConsumed && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.vlsfoConsumed}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Fuel 24h - LSMGO (MT){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="lsmgoConsumed"
                    value={form.lsmgoConsumed}
                    onChange={handleChange}
                    className={errors.lsmgoConsumed ? "border-red-500" : ""}
                  />
                  {errors.lsmgoConsumed && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lsmgoConsumed}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* WEATHER */}
            <ComponentCard title="Weather">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Wind / Beaufort Scale{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="windForce"
                    value={form.windForce}
                    placeholder="e.g. NW 15 kn / BF 4"
                    onChange={handleChange}
                    className={errors.windForce ? "border-red-500" : ""}
                  />
                  {errors.windForce && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.windForce}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Sea State / Swell <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="seaState"
                    value={form.seaState}
                    onChange={handleChange}
                    className={errors.seaState ? "border-red-500" : ""}
                  />
                  {errors.seaState && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.seaState}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label>Weather Remarks</Label>
                <TextArea
                  name="weatherRemarks"
                  rows={4}
                  placeholder="Any additional details about weather, visibility, current, etc."
                  value={form.weatherRemarks}
                  onChange={handleChange}
                  className={errors.weatherRemarks ? "border-red-500" : ""}
                />
                {errors.weatherRemarks && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.weatherRemarks}
                  </p>
                )}
              </div>
            </ComponentCard>

            {/* GENERAL REMARKS */}
            <ComponentCard title="General Remarks">
              <Label>Remarks</Label>
              <TextArea
                name="generalRemarks"
                rows={4}
                placeholder="Any operational notes, incidents, speed changes, instructions, etc."
                value={form.generalRemarks}
                onChange={handleChange}
                className={errors.generalRemarks ? "border-red-500" : ""}
              />
              {errors.generalRemarks && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.generalRemarks}
                </p>
              )}
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}
