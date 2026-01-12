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
import { useVoyageLogic } from "@/hooks/useVoyageLogic"; // ✅ Import Hook
import SearchableSelect from "@/components/form/SearchableSelect";

interface AddDepartureReportButtonProps {
  onSuccess: () => void;
  vesselList: any[];
}

interface APIErrorDetail {
  field: string;
  message: string;
}

export default function AddDepartureReportButton({
  onSuccess,vesselList
}: AddDepartureReportButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const { can, isReady } = useAuthorization();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [voyageList, setVoyageList] = useState<{ value: string; label: string }[]>([]);
  const getCurrentDateTime = () => {
    return new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  // ✅ 1. STATE MUST BE DEFINED FIRST
  const [formData, setFormData] = useState({
    vesselName: "", // Changed from "AN16" to empty to force selection
    vesselId: "",   // 👈 Crucial for the hook
    voyageId: "",
    portName: "",
    lastPort: "",
    eventTime: "",
    reportDate: getCurrentDateTime(),
    distanceToNextPortNm: "",
    etaNextPort: "",
    robVlsfo: "",
    robLsmgo: "",
    bunkersReceivedVlsfo: "",
    bunkersReceivedLsmgo: "",
    cargoQtyLoadedMt: "",
    cargoQtyUnloadedMt: "",
    cargoSummary: "",
    remarks: "",
  });

  // ✅ 2. CALL HOOK (Now it can see formData)
  const { suggestedVoyageNo } = useVoyageLogic(
     formData.vesselId || undefined,
     formData.reportDate
   );

  // ✅ 3. SYNC LOGIC (Auto-fill Voyage)
  useEffect(() => {
    if (suggestedVoyageNo !== undefined && suggestedVoyageNo !== formData.voyageId) {
      if (suggestedVoyageNo) {
        
      }
      setFormData((prev) => ({ ...prev, voyageId: suggestedVoyageNo }));
    }
  }, [suggestedVoyageNo]);

  // Handle standard input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ 4. VESSEL SELECTION HANDLER
  const handleVesselChange = (selectedName: string) => {
    // Find the ID based on the name from the HOOK's vessel list
  const selectedVessel = vesselList.find((v: any) => v.name === selectedName);;

    setFormData((prev) => ({
      ...prev,
      vesselName: selectedName,
      vesselId: selectedVessel?._id || "", // 👈 Save ID to trigger hook
    }));

    if (errors.vesselName) {
      setErrors((prev) => ({ ...prev, vesselName: "" }));
    }
  };
  const handleVoyageChange = (val: string) => {
    setFormData((prev) => ({ ...prev, voyageId: val }));
    if (errors.voyageId) {
      setErrors((prev) => ({ ...prev, voyageId: "" }));
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);

    setFormData({
      vesselName: "",
      vesselId: "",
      voyageId: "",
      portName: "",
      lastPort: "",
      eventTime: "",
      reportDate: getCurrentDateTime(),
      distanceToNextPortNm: "",
      etaNextPort: "",
      robVlsfo: "",
      robLsmgo: "",
      bunkersReceivedVlsfo: "",
      bunkersReceivedLsmgo: "",
      cargoQtyLoadedMt: "",
      cargoQtyUnloadedMt: "",
      cargoSummary: "",
      remarks: "",
    });

    closeModal();
  };

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      // Clean payload
      const payload = {
        vesselId: formData.vesselId,
        vesselName: formData.vesselName,
        voyageId: formData.voyageId,
        portName: formData.portName,
        lastPort: formData.lastPort,
        eventTime: formData.eventTime ? `${formData.eventTime}+05:30` : undefined,
        reportDate: formData.reportDate ? `${formData.reportDate}+05:30` : null,
        distance_to_next_port_nm: formData.distanceToNextPortNm === "" ? undefined : Number(formData.distanceToNextPortNm),
        etaNextPort: formData.etaNextPort ? `${formData.etaNextPort}+05:30` : null,
        robVlsfo: formData.robVlsfo === "" ? undefined : Number(formData.robVlsfo),
        robLsmgo: formData.robLsmgo === "" ? undefined : Number(formData.robLsmgo),
        bunkers_received_vlsfo_mt: formData.bunkersReceivedVlsfo === "" ? undefined : Number(formData.bunkersReceivedVlsfo),
        bunkers_received_lsmgo_mt: formData.bunkersReceivedLsmgo === "" ? undefined : Number(formData.bunkersReceivedLsmgo),
        cargo_qty_loaded_mt: formData.cargoQtyLoadedMt === "" ? undefined : Number(formData.cargoQtyLoadedMt),
        cargo_qty_unloaded_mt: formData.cargoQtyUnloadedMt === "" ? undefined : Number(formData.cargoQtyUnloadedMt),
        cargoSummary: formData.cargoSummary,
        remarks: formData.remarks,
      };

      const res = await fetch("/api/departure-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((e: APIErrorDetail) => {
            const key = e.field === "" ? "object" : e.field;
            fieldErrors[key] = e.message;
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
   
  useEffect(() => {
    async function fetchAndFilterVoyages() {
      // ❌ WAS: if (!form.vesselId)
      // ✅ FIX: Use formData
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
              v.voyageNo === formData.voyageId; // ✅ Fixed property name

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
  }, [formData.vesselId, formData.vesselName, suggestedVoyageNo, formData.voyageId]);


  const canCreate = isReady && can("departure.create");

  if (!isReady || !canCreate) return null;
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

                <div>
                  <Label>
                    Vessel Name <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
 options={vesselList.map((v: any) => ({
    value: v.name,
    label: v.name,
  }))}
  placeholder="Search Vessel"
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
  options={voyageList}
  placeholder={
    !formData.vesselId
      ? "Select Vessel first"
      : voyageList.length === 0
      ? "No active voyages found"
      : "Search Voyage"
  }
  value={formData.voyageId}
  onChange={handleVoyageChange}

  className={errors.voyageNo ? "border-red-500" : ""}
  error={!!errors.voyageId}
/>
                  
                 
{errors.voyageId && (
    <p className="text-red-500 text-xs mt-1">{errors.voyageId}</p>
  )}
                </div>

                <div>
                  <Label>
                    Last Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="lastPort"
                    value={formData.lastPort}
                    onChange={handleChange}
                    placeholder="Enter last port"
                    className={errors.lastPort ? "border-red-500" : ""}
                  />
                  {errors.lastPort && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastPort}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Current Port Name <span className="text-red-500">*</span>
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
                    Distance to Next Port (NM){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="distanceToNextPortNm"
                    value={formData.distanceToNextPortNm}
                    onChange={handleChange}
                    className={
                      errors.distance_to_next_port_nm ? "border-red-500" : ""
                    }
                  />
                  {errors.distance_to_next_port_nm && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.distance_to_next_port_nm}
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

            {/* BUNKER & ROB */}
            <ComponentCard title="Bunkers & ROB at Departure">
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
                <div>
                  <Label>
                    Bunkers Received - VLSFO (MT){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="bunkersReceivedVlsfo"
                    value={formData.bunkersReceivedVlsfo}
                    onChange={handleChange}
                    className={
                      errors.bunkers_received_vlsfo_mt ? "border-red-500" : ""
                    }
                  />
                  {errors.bunkers_received_vlsfo_mt && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.bunkers_received_vlsfo_mt}
                    </p>
                  )}
                </div>
                <div>
                  <Label>
                    Bunkers Received - LSMGO (MT){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    name="bunkersReceivedLsmgo"
                    value={formData.bunkersReceivedLsmgo}
                    onChange={handleChange}
                    className={
                      errors.bunkers_received_lsmgo_mt ? "border-red-500" : ""
                    }
                  />
                  {errors.bunkers_received_lsmgo_mt && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.bunkers_received_lsmgo_mt}
                    </p>
                  )}
                </div>
              </div>
            </ComponentCard>

            {/* CARGO */}
            <ComponentCard title="Cargo Details">
              {/* OBJECT LEVEL ERROR DISPLAY */}
              {errors["object"] && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {errors["object"]}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div>
                  <Label>Qty Loaded (MT)</Label>
                  <Input
                    type="number"
                    name="cargoQtyLoadedMt"
                    value={formData.cargoQtyLoadedMt}
                    onChange={handleChange}
                    // If the object error exists, we highlight both inputs
                    className={
                      errors.cargo_qty_loaded_mt || errors["object"]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {errors.cargo_qty_loaded_mt && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.cargo_qty_loaded_mt}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Qty Unloaded (MT)</Label>
                  <Input
                    type="number"
                    name="cargoQtyUnloadedMt"
                    value={formData.cargoQtyUnloadedMt}
                    onChange={handleChange}
                    className={
                      errors.cargo_qty_unloaded_mt || errors["object"]
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {errors.cargo_qty_unloaded_mt && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.cargo_qty_unloaded_mt}
                    </p>
                  )}
                </div>
              </div>

              <Label>
                Cargo Summary <span className="text-red-500">*</span>
              </Label>
              <TextArea
                name="cargoSummary"
                rows={4}
                className={errors.cargoSummary ? "border-red-500" : ""}
                placeholder="Brief description of cargo loaded/unloaded, grades and quantities."
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
                placeholder="Any additional notes..."
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
