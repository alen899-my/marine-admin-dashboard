"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import Checkbox from "@/components/form/input/Checkbox"; // Using your custom Checkbox
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

// --- Types Matching Mongoose Schema ---
interface Dimensions {
  loa?: number;
  beam?: number;
  maxDraft?: number;
  dwt?: number;
  grossTonnage?: number;
}

interface Performance {
  designSpeed?: number;
  ballastConsumption?: number;
  ladenConsumption?: number;
}

interface Machinery {
  mainEngine?: string;
  allowedFuels?: string[];
}
interface UserRef {
  _id: string;
  fullName: string;
}

interface Vessel {
  _id: string;
  name: string;
  imo: string;
  company?: { _id: string; name: string } | any;
  fleet?: string;
  status: "active" | "inactive" | "laid_up" | "sold" | "dry_dock";
  callSign?: string;
  mmsi?: string;
  flag?: string;
  yearBuilt?: number;
  dimensions?: Dimensions;
  performance?: Performance;
  machinery?: Machinery;

  createdBy?: UserRef; // It might be an object now due to populate
  updatedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

// Helper for Edit Form Data (Flattened where needed for inputs, but keeping structure is also fine)
interface EditFormData extends Omit<Vessel, "_id" | "createdAt"> {}

interface VesselTableProps {
  refresh: number;
  search: string;
  status: string;
  companyId: string;
  startDate: string;
  endDate: string;
  setTotalCount?: Dispatch<SetStateAction<number>>;
}

export default function VesselTable({
  refresh,
  search,
  status,
  companyId,
  startDate,
  endDate,
  setTotalCount,
}: VesselTableProps) {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [companiesList, setCompaniesList] = useState<
    { value: string; label: string }[]
  >([]);

  // Modals
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Selection
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  // Permissions
  const { can, isReady } = useAuthorization();
  // Using generic placeholders; adjust to your actual permission strings
  const canEdit = can("vessels.edit");
  const canDelete = can("vessels.delete");

  /* ================= HELPERS ================= */

  // Format Date if needed (e.g. for CreatedAt)
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  // 4. Fetch companies when Edit Modal opens
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
    if (openEdit) fetchCompanies();
  }, [openEdit]);

  /* ================= COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: Vessel, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Vessel Name",
      render: (v: Vessel) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {v.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            {v.fleet && <span>{v.fleet}</span>}
            {v.flag && (
              <>
                <span className="opacity-30">|</span>
                <span>{v.flag}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    //  IMPROVED: Grid layout for perfect alignment & better spacing
    {
      header: "Identification",
      render: (v: Vessel) => (
        <div className="flex flex-col gap-1 text-xs min-w-[140px]">
          {/* IMO: Darker & Monospace font for readability */}
          <div className="grid grid-cols-[55px_1fr] items-center">
            <span className="text-gray-400 font-medium">IMO</span>
            <span className="text-gray-900 dark:text-white font-bold font-mono tracking-tight">
              {v.imo}
            </span>
          </div>

          {/* Call Sign */}
          <div className="grid grid-cols-[55px_1fr] items-center">
            <span className="text-gray-400">Call Sign</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.callSign || "-"}
            </span>
          </div>

          {/* MMSI */}
          <div className="grid grid-cols-[55px_1fr] items-center">
            <span className="text-gray-400">MMSI</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.mmsi || "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Company", //  New Column
      render: (v: Vessel) => {
        const companyName =
          typeof v.company === "object" ? v.company?.name : "N/A";
        return (
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {companyName || "N/A"}
          </span>
        );
      },
    },
    {
      header: "Dimensions",
      render: (v: Vessel) => (
        <div className="flex flex-col gap-1 text-xs min-w-[120px]">
          <div className="flex grid-cols-[55px_1fr] justify-between">
            <span className="text-gray-400">LOA</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.dimensions?.loa ? `${v.dimensions.loa} M` : "-"}
            </span>
          </div>
          <div className="flex grid-cols-[55px_1fr] justify-between">
            <span className="text-gray-400">Beam</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.dimensions?.beam ? `${v.dimensions.beam} M` : "-"}
            </span>
          </div>
          <div className="flex grid-cols-[55px_1fr] justify-between">
            <span className="text-gray-400">Draft</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.dimensions?.maxDraft ? `${v.dimensions.maxDraft} M` : "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Capacity",
      render: (v: Vessel) => (
        <div className="flex flex-col gap-1 text-xs min-w-[90px]">
          <div className="flex grid-cols-[55px_1fr] justify-between">
            <span className="text-gray-400">DWT</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {v.dimensions?.dwt ? `${v.dimensions.dwt.toLocaleString()}` : "-"}
            </span>
          </div>
          <div className="flex grid-cols-[55px_1fr] justify-between">
            <span className="text-gray-400">GT</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.dimensions?.grossTonnage
                ? v.dimensions.grossTonnage.toLocaleString()
                : "-"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Machinery",
      render: (v: Vessel) => (
        <div className="flex flex-col gap-1.5 max-w-[180px]">
          <div className="text-xs">
            <span className="text-gray-400 block text-[10px] uppercase mb-0.5">
              Main Engine
            </span>
            <span
              className="text-gray-700 dark:text-gray-300 font-medium line-clamp-1"
              title={v.machinery?.mainEngine}
            >
              {v.machinery?.mainEngine || "-"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {v.machinery?.allowedFuels?.slice(0, 3).map((f) => (
              <span
                key={f}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/5"
              >
                {f}
              </span>
            ))}
            {(v.machinery?.allowedFuels?.length || 0) > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-50 text-gray-400 dark:bg-white/5">
                +{v.machinery!.allowedFuels!.length - 3}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      render: (v: Vessel) => {
        let color:
          | "success"
          | "warning"
          | "error"
          | "default"
          | "info"
          | "purple" = "default";
        let label: string = v.status;

        switch (v.status) {
          case "active":
            color = "success";
            label = "Active";
            break;
          case "inactive":
            color = "error";
            label = "Inactive";
            break;
          case "laid_up":
            color = "warning";
            label = "Laid Up";
            break;
          case "sold":
            color = "info";
            label = "Sold";
            break;
          case "dry_dock":
            color = "purple";
            label = "Dry Dock";
            break;
          default:
            label = v.status;
        }

        return <Badge color={color}>{label}</Badge>;
      },
    },
  ];
  /* ================= FETCH ================= */
  const fetchVessels = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          search,
          status: status === "all" ? "" : status,

          companyId: companyId === "all" ? "" : companyId,

          startDate,
          endDate,
        });

        const res = await fetch(`/api/vessels?${query.toString()}`);
        if (!res.ok) throw new Error();

        const result = await res.json();

        // Handle API response structure (assuming { data: [], pagination: {} } or similar)
        // Adjust based on your actual API response structure
        if (Array.isArray(result)) {
          // If API returns plain array (from previous GET example), we manually paginate or handle it
          setVessels(result);
          setTotalPages(1);
        } else {
          setVessels(result.data || []);

          // UPDATE DYNAMIC COUNT
          if (setTotalCount) {
            setTotalCount(result.pagination?.total || result.length || 0);
          }

          setTotalPages(result.pagination?.totalPages || 1);
        }
      } catch (err) {
        setVessels([]);
        setTotalPages(1);
        toast.error("Failed to load vessels");
      } finally {
        setLoading(false);
      }
    },
    [search, status, startDate, endDate, companyId],
  );

  useEffect(() => {
    fetchVessels(1);
    setCurrentPage(1);
  }, [fetchVessels, companyId]);

  useEffect(() => {
    if (currentPage > 1) fetchVessels(currentPage);
  }, [currentPage, fetchVessels]);

  useEffect(() => {
    if (refresh) {
      fetchVessels(1);
      setCurrentPage(1);
    }
  }, [refresh, fetchVessels]);

  /* ================= ACTIONS ================= */
  function handleView(vessel: Vessel) {
    setSelectedVessel(vessel);
    setOpenView(true);
  }

  function handleEdit(vessel: Vessel) {
    setSelectedVessel(vessel);
    // Deep copy to avoid mutating state directly and handle potential nulls
    setEditData({
      name: vessel.name,
      imo: vessel.imo,
      fleet: vessel.fleet,
      status: vessel.status,
      callSign: vessel.callSign,
      mmsi: vessel.mmsi,
      flag: vessel.flag,
      yearBuilt: vessel.yearBuilt,
      company:
        typeof vessel.company === "object"
          ? vessel.company?._id
          : vessel.company,
      dimensions: { ...vessel.dimensions },
      performance: { ...vessel.performance },
      machinery: {
        mainEngine: vessel.machinery?.mainEngine,
        allowedFuels: vessel.machinery?.allowedFuels || [],
      },
    });
    setOpenEdit(true);
  }

  async function handleUpdate() {
    if (!selectedVessel || !editData) return;
    setSaving(true);

    try {
      // Ensure numeric fields are actually numbers
      const payload = {
        ...editData,
        company: editData.company,
        yearBuilt: Number(editData.yearBuilt),
        dimensions: {
          loa: Number(editData.dimensions?.loa),
          beam: Number(editData.dimensions?.beam),
          maxDraft: Number(editData.dimensions?.maxDraft),
          dwt: Number(editData.dimensions?.dwt),
          grossTonnage: Number(editData.dimensions?.grossTonnage),
        },
        performance: {
          designSpeed: Number(editData.performance?.designSpeed),
          ballastConsumption: Number(editData.performance?.ballastConsumption),
          ladenConsumption: Number(editData.performance?.ladenConsumption),
        },
      };

      const res = await fetch(`/api/vessels/${selectedVessel._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      const responseData = await res.json();
      const updatedVesselData = responseData.report || responseData.data;

      setVessels((prev) =>
        prev.map((v) =>
          v._id === updatedVesselData._id ? updatedVesselData : v,
        ),
      );
      toast.success("Vessel updated successfully");
      setOpenEdit(false);
      setSelectedVessel(null);
      if (refresh) fetchVessels(currentPage);
    } catch {
      toast.error("Failed to update vessel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedVessel) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vessels/${selectedVessel._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setVessels((prev) => prev.filter((v) => v._id !== selectedVessel._id));

      // UPDATE DYNAMIC COUNT ON DELETE
      if (setTotalCount) {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }

      toast.success("Vessel deleted successfully");
    } catch {
      toast.error("Failed to delete vessel");
    } finally {
      setOpenDelete(false);
      setSelectedVessel(null);
      setIsDeleting(false); //  Stop Loading
    }
  }

  // Handle Edit Helpers
  const handleEditChange = (key: keyof EditFormData, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [key]: value });
  };

  const handleNestedEditChange = (
    parent: "dimensions" | "performance" | "machinery",
    key: string,
    value: any,
  ) => {
    if (!editData) return;
    setEditData({
      ...editData,
      [parent]: { ...editData[parent], [key]: value },
    });
  };

  const handleFuelToggle = (fuel: string) => {
    if (!editData || !editData.machinery) return;
    const currentFuels = editData.machinery.allowedFuels || [];
    const newFuels = currentFuels.includes(fuel)
      ? currentFuels.filter((f) => f !== fuel)
      : [...currentFuels, fuel];

    handleNestedEditChange("machinery", "allowedFuels", newFuels);
  };

  if (!isReady) return null;

  /* ================= RENDER ================= */
  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={vessels}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (v: Vessel) => {
                      setSelectedVessel(v);
                      setOpenDelete(true);
                    }
                  : undefined
              }
              onRowClick={handleView}
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW MODAL ================= */}

      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Vessel Details"
        headerRight={
          selectedVessel && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">{selectedVessel.name}</span>
              <span>|</span>
              <span className=" ">{selectedVessel.imo}</span>
            </div>
          )
        }
      >
        <div className="text-[13px] py-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* GENERAL INFO */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                General Information
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Vessel Name</span>
                <span className="font-medium">
                  {selectedVessel?.name || "-"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">IMO Number</span>
                <span className="font-medium">
                  {selectedVessel?.imo || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Company</span>
                <span className="font-medium">
                  {typeof selectedVessel?.company === "object"
                    ? selectedVessel.company.name
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Fleet</span>
                <span className="font-medium">
                  {selectedVessel?.fleet || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Call Sign</span>
                <span className="font-medium">
                  {selectedVessel?.callSign || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">MMSI</span>
                <span className="font-medium">
                  {selectedVessel?.mmsi || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Flag</span>
                <span className="font-medium">
                  {selectedVessel?.flag || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Year Built</span>
                <span className="font-medium">
                  {selectedVessel?.yearBuilt || "-"}
                </span>
              </div>
            </section>

            {/* DIMENSIONS */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Dimensions
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">LOA</span>
                <span className="font-medium">
                  {selectedVessel?.dimensions?.loa} M
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Beam</span>
                <span className="font-medium">
                  {selectedVessel?.dimensions?.beam} M
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Max Draft</span>
                <span className="font-medium">
                  {selectedVessel?.dimensions?.maxDraft} M
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Deadweight</span>
                <span className="font-medium">
                  {selectedVessel?.dimensions?.dwt} MT
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Gross Tonnage</span>
                <span className="font-medium">
                  {selectedVessel?.dimensions?.grossTonnage} GT
                </span>
              </div>
            </section>

            {/* PERFORMANCE */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Performance
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Design Speed</span>
                <span className="font-medium">
                  {selectedVessel?.performance?.designSpeed} KN
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Ballast Consumption</span>
                <span className="font-medium">
                  {selectedVessel?.performance?.ballastConsumption} MT/day
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Laden Consumption</span>
                <span className="font-medium">
                  {selectedVessel?.performance?.ladenConsumption} MT/day
                </span>
              </div>
            </section>

            {/* MACHINERY */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Machinery
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Main Engine</span>
                <span className="font-medium">
                  {selectedVessel?.machinery?.mainEngine || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4 items-start">
                <span className="text-gray-500 shrink-0">Allowed Fuels</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {selectedVessel?.machinery?.allowedFuels?.map((f) => (
                    <span
                      key={f}
                      className="bg-gray-100 dark:bg-white/10 px-1.5 rounded text-[10px]"
                    >
                      {f}
                    </span>
                  ))}
                  {!selectedVessel?.machinery?.allowedFuels?.length && (
                    <span>-</span>
                  )}
                </div>
              </div>
            </section>

            <section className="md:col-span-2 space-y-1.5 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedVessel?.createdBy?.fullName || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedVessel?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedVessel?.updatedBy?.fullName || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedVessel?.updatedAt)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* STATUS FOOTER */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Status
            </span>

            {(() => {
              if (!selectedVessel) return null;

              let color: "success" | "warning" | "error" | "default" | "light" =
                "default";
              let label: string = selectedVessel.status;

              switch (selectedVessel.status) {
                case "active":
                  color = "success";
                  label = "Active";
                  break;
                case "laid_up":
                  color = "warning";
                  label = "Laid Up";
                  break;
                case "sold":
                  color = "error";
                  label = "Sold";
                  break;
                case "dry_dock":
                  color = "default";
                  label = "Dry Dock";
                  break;
                default:
                  label = selectedVessel.status;
              }

              return <Badge color={color}>{label}</Badge>;
            })()}
          </div>
        </div>
      </ViewModal>

      {/* ================= EDIT MODAL ================= */}
      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Vessel"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
            {/* SECTION 1: GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Vessel Name"
                  value={editData.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                />
                <InputField
                  label="IMO Number"
                  value={editData.imo}
                  onChange={(e) => handleEditChange("imo", e.target.value)}
                />
                <div>
                  <Label>Company</Label>
                  <SearchableSelect
                    options={companiesList}
                    value={editData.company}
                    onChange={(val) => handleEditChange("company", val)}
                    placeholder="Select Company"
                  />
                </div>
                <InputField
                  label="Fleet"
                  value={editData.fleet}
                  onChange={(e) => handleEditChange("fleet", e.target.value)}
                />

                <div>
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "active", label: "Active" },
                      { value: "laid_up", label: "Laid Up" },
                      { value: "sold", label: "Sold" },
                      { value: "dry_dock", label: "Dry Dock" },
                    ]}
                    value={editData.status}
                    onChange={(val) => handleEditChange("status", val)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
                <InputField
                  label="Call Sign"
                  value={editData.callSign}
                  onChange={(e) => handleEditChange("callSign", e.target.value)}
                />
                <InputField
                  label="MMSI"
                  value={editData.mmsi}
                  onChange={(e) => handleEditChange("mmsi", e.target.value)}
                />
                <InputField
                  label="Flag"
                  value={editData.flag}
                  onChange={(e) => handleEditChange("flag", e.target.value)}
                />
                <InputField
                  label="Year Built"
                  type="number"
                  value={editData.yearBuilt}
                  onChange={(e) =>
                    handleEditChange("yearBuilt", e.target.value)
                  }
                />
              </div>
            </ComponentCard>

            {/* SECTION 2: DIMENSIONS */}
            <ComponentCard title="Dimensions">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField
                  label="LOA (m)"
                  type="number"
                  value={editData.dimensions?.loa}
                  onChange={(e) =>
                    handleNestedEditChange("dimensions", "loa", e.target.value)
                  }
                />
                <InputField
                  label="Beam (m)"
                  type="number"
                  value={editData.dimensions?.beam}
                  onChange={(e) =>
                    handleNestedEditChange("dimensions", "beam", e.target.value)
                  }
                />
                <InputField
                  label="Max Draft (m)"
                  type="number"
                  value={editData.dimensions?.maxDraft}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "dimensions",
                      "maxDraft",
                      e.target.value,
                    )
                  }
                />
                <InputField
                  label="DWT (MT)"
                  type="number"
                  value={editData.dimensions?.dwt}
                  onChange={(e) =>
                    handleNestedEditChange("dimensions", "dwt", e.target.value)
                  }
                />
                <InputField
                  label="Gross Tonnage (GT)"
                  type="number"
                  value={editData.dimensions?.grossTonnage}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "dimensions",
                      "grossTonnage",
                      e.target.value,
                    )
                  }
                />
              </div>
            </ComponentCard>

            {/* SECTION 3: PERFORMANCE */}
            <ComponentCard title="Performance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField
                  label="Design Speed (kn)"
                  type="number"
                  value={editData.performance?.designSpeed}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "performance",
                      "designSpeed",
                      e.target.value,
                    )
                  }
                />
                <InputField
                  label="Ballast Cons. (MT)"
                  type="number"
                  value={editData.performance?.ballastConsumption}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "performance",
                      "ballastConsumption",
                      e.target.value,
                    )
                  }
                />
                <InputField
                  label="Laden Cons. (MT)"
                  type="number"
                  value={editData.performance?.ladenConsumption}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "performance",
                      "ladenConsumption",
                      e.target.value,
                    )
                  }
                />
              </div>
            </ComponentCard>

            {/* SECTION 4: MACHINERY */}
            <ComponentCard title="Machinery">
              <div className="space-y-4">
                <InputField
                  label="Main Engine Model"
                  value={editData.machinery?.mainEngine}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "machinery",
                      "mainEngine",
                      e.target.value,
                    )
                  }
                />

                <div>
                  <Label className="mb-2 block">Allowed Fuels</Label>
                  <div className="flex flex-wrap gap-4">
                    {["HFO", "VLSFO", "LSMGO", "MGO", "LNG"].map((fuel) => (
                      <Checkbox
                        key={fuel}
                        label={fuel}
                        checked={
                          editData.machinery?.allowedFuels?.includes(fuel) ||
                          false
                        }
                        onChange={() => handleFuelToggle(fuel)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>
        )}
      </EditModal>

      {/* ================= DELETE CONFIRM ================= */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}

/* ================= HELPERS ================= */
function InputField({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
