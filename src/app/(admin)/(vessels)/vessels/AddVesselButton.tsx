"use client";

import AddForm from "@/components/common/AddForm";
import ComponentCard from "@/components/common/ComponentCard";
import Checkbox from "@/components/form/input/Checkbox"; // Added Checkbox Import
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useModal } from "@/hooks/useModal";
import { vesselSchema } from "@/lib/validations/vesselSchema";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface AddVesselButtonProps {
  onSuccess: () => void;
  className?: string;
}

export default function AddVesselButton({ onSuccess,className }: AddVesselButtonProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { can, isReady } = useAuthorization();
  const { data: session } = useSession();
  const loggedInUserRole = session?.user?.role?.toLowerCase();
  const loggedInUserCompanyId = session?.user?.company?.id;
  const isActorSuperAdmin = loggedInUserRole === "super-admin";
  const [companiesList, setCompaniesList] = useState<{ value: string; label: string }[]>([]);

  // Fetch companies
useEffect(() => {
  async function fetchCompanies() {
    try {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const json = await res.json();
        const formatted = (json.data || []).map((c: any) => ({
          value: c._id,
          label: c.name,
        }));
        setCompaniesList(formatted);
      }
    } catch (error) {
      console.error("Failed to load companies", error);
    }
  }
  if (isOpen) fetchCompanies();
}, [isOpen]);

  const initialFormState = {
    name: "",
    imo: "",
    company: "",
    fleet: "",
    status: "active",
    callSign: "",
    mmsi: "",
    flag: "",
    yearBuilt: "",
    loa: "",
    beam: "",
    maxDraft: "",
    dwt: "",
    grossTonnage: "",
    designSpeed: "",
    ballastConsumption: "",
    ladenConsumption: "",
    mainEngine: "",
    allowedFuels: [] as string[],
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const json = await res.json();
          let formatted = (json.data || []).map((c: any) => ({
            value: c._id,
            label: c.name,
          }));

          // 🔒 FILTER: Only show their own company if not super admin
          if (!isActorSuperAdmin && loggedInUserCompanyId) {
            formatted = formatted.filter((c: any) => c.value === loggedInUserCompanyId);
            
            // ✅ AUTO-FILL: Pre-select the company in the form state
            setFormData(prev => ({ ...prev, company: loggedInUserCompanyId }));
          }
          
          setCompaniesList(formatted);
        }
      } catch (error) {
        console.error("Failed to load companies", error);
      }
    }
    if (isOpen) fetchCompanies();
  }, [isOpen, isActorSuperAdmin, loggedInUserCompanyId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFuelChange = (fuel: string) => {
    setFormData((prev) => {
      const fuels = prev.allowedFuels.includes(fuel)
        ? prev.allowedFuels.filter((f) => f !== fuel)
        : [...prev.allowedFuels, fuel];
      return { ...prev, allowedFuels: fuels };
    });
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
      name: formData.name,
      imo: formData.imo,
      company: formData.company,
      fleet: formData.fleet,
      status: formData.status,
      callSign: formData.callSign,
      mmsi: formData.mmsi,
      flag: formData.flag,
      yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
      dimensions: {
        loa: formData.loa ? Number(formData.loa) : undefined,
        beam: formData.beam ? Number(formData.beam) : undefined,
        maxDraft: formData.maxDraft ? Number(formData.maxDraft) : undefined,
        dwt: formData.dwt ? Number(formData.dwt) : undefined,
        grossTonnage: formData.grossTonnage
          ? Number(formData.grossTonnage)
          : undefined,
      },
      performance: {
        designSpeed: formData.designSpeed
          ? Number(formData.designSpeed)
          : undefined,
        ballastConsumption: formData.ballastConsumption
          ? Number(formData.ballastConsumption)
          : undefined,
        ladenConsumption: formData.ladenConsumption
          ? Number(formData.ladenConsumption)
          : undefined,
      },
      machinery: {
        mainEngine: formData.mainEngine,
        allowedFuels: formData.allowedFuels,
      },
    };

    const validation = vesselSchema.validate(payload, { abortEarly: false });

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
      const res = await fetch("/api/vessels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          toast.error(data?.error || "Failed to add vessel");
        }
        return;
      }

      toast.success("Vessel added successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Vessel submit failed", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isReady && can("vessels.create");

  if (!isReady) return null;
  if (!canCreate) return null;

  return (
    <>
      <Button size="md"    className={className}  variant="primary" onClick={openModal}>
        Add Vessel
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
          title="Add New Vessel"
          description="Enter vessel technical details and specifications."
          submitLabel={isSubmitting ? "Adding..." : "Add Vessel"}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        >
          <div className="max-h-[70dvh] overflow-y-auto p-1 space-y-3">
            {/* 1. GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>
                    Vessel Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                    placeholder="e.g. MV OCEAN STAR"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label>
                    IMO Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="imo"
                    value={formData.imo}
                    onChange={handleChange}
                    className={errors.imo ? "border-red-500" : ""}
                    placeholder="e.g. 9876543"
                  />
                  {errors.imo && (
                    <p className="text-xs text-red-500 mt-1">{errors.imo}</p>
                  )}
                </div>

                <div>
                  <Label>Company <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    options={companiesList}
                    value={formData.company}
                    onChange={(val) => handleSelectChange("company", val)}
                    placeholder={isActorSuperAdmin ? "Select Company" : "Your Organization"}
                    error={!!errors.company}
                    // Optional: keep it enabled or disabled based on your preference
                    // disabled={!isActorSuperAdmin} 
                  />
                  {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                </div>

                <div>
                  <Label>Fleet</Label>
                  <Input
                    name="fleet"
                    value={formData.fleet}
                    onChange={handleChange}
                    placeholder="e.g. Tanker Fleet A"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "active", label: "Active" },
                      { value: "laid_up", label: "Laid Up" },
                      { value: "sold", label: "Sold" },
                      { value: "dry_dock", label: "Dry Dock" },
                    ]}
                    value={formData.status}
                    onChange={(val) => handleSelectChange("status", val)}
                    placeholder="Select Status"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
                <div>
                  <Label>Call Sign</Label>
                  <Input
                    name="callSign"
                    value={formData.callSign}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>MMSI</Label>
                  <Input
                    name="mmsi"
                    value={formData.mmsi}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Flag</Label>
                  <Input
                    name="flag"
                    value={formData.flag}
                    onChange={handleChange}
                    placeholder="e.g. Panama"
                  />
                </div>
                <div>
                  <Label>Year Built</Label>
                  <Input
                    name="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 2. DIMENSIONS */}
            <ComponentCard title="Dimensions">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <Label>LOA (m)</Label>
                  <Input
                    type="number"
                    name="loa"
                    value={formData.loa}
                    onChange={handleChange}
                    placeholder="Length Overall"
                  />
                </div>
                <div>
                  <Label>Beam (m)</Label>
                  <Input
                    type="number"
                    name="beam"
                    value={formData.beam}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Max Draft (m)</Label>
                  <Input
                    type="number"
                    name="maxDraft"
                    value={formData.maxDraft}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>DWT (MT)</Label>
                  <Input
                    type="number"
                    name="dwt"
                    value={formData.dwt}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Gross Tonnage (GT)</Label>
                  <Input
                    type="number"
                    name="grossTonnage"
                    value={formData.grossTonnage}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 3. PERFORMANCE */}
            <ComponentCard title="Performance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <Label>Design Speed (kn)</Label>
                  <Input
                    type="number"
                    name="designSpeed"
                    value={formData.designSpeed}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Ballast Cons. (MT/day)</Label>
                  <Input
                    type="number"
                    name="ballastConsumption"
                    value={formData.ballastConsumption}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label>Laden Cons. (MT/day)</Label>
                  <Input
                    type="number"
                    name="ladenConsumption"
                    value={formData.ladenConsumption}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </ComponentCard>

            {/* 4. MACHINERY */}
            <ComponentCard title="Machinery">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Label>Main Engine Model</Label>
                  <Input
                    name="mainEngine"
                    value={formData.mainEngine}
                    onChange={handleChange}
                    placeholder="e.g. MAN B&W 6S50ME-C"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-2 block">Allowed Fuels</Label>
                  <div className="flex flex-wrap gap-4">
                    {["HFO", "VLSFO", "LSMGO", "MGO", "LNG"].map((fuel) => (
                      <Checkbox
                        key={fuel}
                        label={fuel}
                        checked={formData.allowedFuels.includes(fuel)}
                        onChange={() => handleFuelChange(fuel)}
                        variant="default" // Optional: can be 'success', 'danger'
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        </AddForm>
      </Modal>
    </>
  );
}