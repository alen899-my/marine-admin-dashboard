"use client";

import { useAuthorization } from "@/hooks/useAuthorization";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

// UI Components
import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import SearchableSelect from "@/components/form/SearchableSelect";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
// Form Components
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

// --- Types ---
interface UserRef {
  _id: string;
  fullName: string;
}

interface VesselRef {
  _id: string;
  name: string;
  imo: string;
  company?: {
    _id: string;
    name: string;
  };
}

interface Voyage {
  _id: string;
  vesselId: VesselRef; // Populated
  voyageNo: string;
  status: "scheduled" | "active" | "completed" | "deleted";

  route: {
    loadPort: string;
    dischargePort: string;
    via?: string;
    totalDistance?: number;
  };

  schedule: {
    startDate?: string;
    eta?: string;
    endDate?: string;
  };

  cargo: {
    commodity?: string;
    quantity?: number;
    grade?: string;
  };

  charter: {
    chartererName?: string;
    charterPartyDate?: string;
    laycanStart?: string;
    laycanEnd?: string;
  };

  createdBy?: UserRef;
  updatedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

// Edit Form Data (Clone of Voyage but flattened/adjustable for state)
interface EditFormData {
  vesselId: string;
  voyageNo: string;
  status: string;
  route: {
    loadPort: string;
    dischargePort: string;
    via: string;
    totalDistance: string | number;
  };
  schedule: {
    startDate: string;
    eta: string;
    endDate: string;
  };
  cargo: {
    commodity: string;
    quantity: string | number;
    grade: string;
  };
  charter: {
    chartererName: string;
    charterPartyDate: string;
    laycanStart: string;
    laycanEnd: string;
  };
}

interface VoyageTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  companyId: string;
  setTotalCount?: Dispatch<SetStateAction<number>>;
  vesselList: any[];
}

export default function VoyageTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
  companyId,
  setTotalCount,
  vesselList,
}: VoyageTableProps) {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(true);
  const [vessels, setVessels] = useState<{ _id: string; name: string }[]>([]);
  // Modals
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // Selection
  const [selectedVoyage, setSelectedVoyage] = useState<Voyage | null>(null);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Pagination
  const prevFiltersRef = useRef({
    search,
    status,
    startDate,
    endDate,
    companyId,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  // Permissions
  const { can, isReady } = useAuthorization();
  const canEdit = can("voyage.edit");
  const canDelete = can("voyage.delete");

  /* ================= HELPERS ================= */
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDateOnly = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ================= COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: Voyage, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Voyage Info",
      render: (v: Voyage) => (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="grid grid-cols-[75px_1fr] items-center text-xs">
            <span className="text-gray-400 font-medium">Voyage No</span>
            <span className="text-gray-900 dark:text-white font-bold font-mono">
              {v.voyageNo}
            </span>
          </div>
          <div className="grid grid-cols-[75px_1fr] items-center text-xs">
            <span className="text-gray-400">Vessel</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {v.vesselId?.name || "Unknown"}
            </span>
          </div>
          {v.charter?.chartererName && (
            <div className="grid grid-cols-[75px_1fr] items-center text-xs">
              <span className="text-gray-400">Charterer</span>
              <span
                className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]"
                title={v.charter.chartererName}
              >
                {v.charter.chartererName}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Company",
      render: (v: Voyage) => (
        <div className="flex flex-col gap-1 min-w-[120px]">
          <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px] text-sm">
            {v.vesselId?.company?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Route",
      render: (v: Voyage) => (
        <div className="flex flex-col gap-0.5 text-xs min-w-[150px]">
          {/* Load Port */}
          <div className="grid grid-cols-[60px_1fr] items-center gap-2">
            <span className="text-gray-400">Load</span>
            <span
              className="text-gray-700 dark:text-gray-300 font-medium truncate"
              title={v.route?.loadPort}
            >
              {v.route?.loadPort}
            </span>
          </div>

          {/* Tiny Arrow visual (Aligned with label) */}
          <div className="grid grid-cols-[60px_1fr] gap-2">
            <span className="text-gray-500 dark:text-gray-600 text-[10px] pl-0.5">
              ↓
            </span>
          </div>

          {/* Discharge Port */}
          <div className="grid grid-cols-[60px_1fr] items-center gap-2">
            <span className="text-gray-400">Discharge</span>
            <span
              className="text-gray-700 dark:text-gray-300 font-medium truncate"
              title={v.route?.dischargePort}
            >
              {v.route?.dischargePort}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Schedule (ETA)",
      render: (v: Voyage) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex gap-2">
            <span className="text-gray-400 w-8">Start:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDateOnly(v.schedule?.startDate)}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-8">ETA:</span>
            <span className="text-gray-900 dark:text-white font-bold">
              {formatDateOnly(v.schedule?.eta)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Cargo",
      render: (v: Voyage) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {v.cargo?.commodity || "-"}
          </span>
          {v.cargo?.quantity && (
            <span className="text-gray-500">
              {v.cargo.quantity.toLocaleString()} MT
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      render: (v: Voyage) => {
        let color: "success" | "warning" | "default" | "error" | "light" =
          "default";
        let label: string = v.status;

        switch (v.status) {
          case "active":
            color = "success";
            label = "Active";
            break;
          case "scheduled":
            color = "warning";
            label = "Scheduled";
            break;
          case "completed":
            color = "default";
            label = "Completed";
            break;
          case "deleted":
            // Logic for soft-deleted voyages
            color = "error"; // Usually red/danger
            label = "Deleted";
            break;
        }

        return <Badge color={color}>{label}</Badge>;
      },
    },
  ];

  /* ================= FETCH ================= */
  const fetchVoyages = useCallback(
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

        const res = await fetch(`/api/voyages?${query.toString()}`);
        if (!res.ok) throw new Error();

        const result = await res.json();

        if (Array.isArray(result)) {
          setVoyages(result);
          setTotalPages(1);
        } else {
          setVoyages(result.data || []);

          // UPDATE DYNAMIC COUNT
          if (setTotalCount) {
            setTotalCount(result.pagination?.total || result.length || 0);
          }

          setTotalPages(result.pagination?.totalPages || 1);
        }
      } catch (err) {
        setVoyages([]);
        setTotalPages(1);
        toast.error("Failed to load voyages");
      } finally {
        setLoading(false);
      }
    },
    [search, status, startDate, endDate, companyId],
  );

  /* ================= ACTIONS ================= */
  function handleView(voyage: Voyage) {
    setSelectedVoyage(voyage);
    setOpenView(true);
  }
  useEffect(() => {
    if (!isReady) return;

    // 1. Detect if the filters actually changed since the last render
    const filtersChanged =
      prevFiltersRef.current.search !== search ||
      prevFiltersRef.current.status !== status ||
      prevFiltersRef.current.startDate !== startDate ||
      prevFiltersRef.current.endDate !== endDate ||
      prevFiltersRef.current.companyId !== companyId;

    // 2. If filters changed, reset to page 1
    if (filtersChanged) {
      // Update the ref with the new values
      prevFiltersRef.current = {
        search,
        status,
        startDate,
        endDate,
        companyId,
      };

      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // The change in currentPage will re-trigger this effect
      }
    }

    // 3. Fetch the data for the current page
    fetchVoyages(currentPage);
  }, [
    currentPage,
    refresh,
    fetchVoyages,
    isReady,
    search,
    status,
    companyId,
    startDate,
    endDate,
  ]);

  function handleEdit(voyage: Voyage) {
    setSelectedVoyage(voyage);
    // Populate Edit Data
    setEditData({
      vesselId: voyage.vesselId?._id || "",
      voyageNo: voyage.voyageNo,
      status: voyage.status,
      route: {
        loadPort: voyage.route.loadPort,
        dischargePort: voyage.route.dischargePort,
        via: voyage.route.via || "",
        totalDistance: voyage.route.totalDistance || "",
      },
      schedule: {
        startDate: voyage.schedule.startDate || "",
        eta: voyage.schedule.eta || "",
        endDate: voyage.schedule.endDate || "",
      },
      cargo: {
        commodity: voyage.cargo.commodity || "",
        quantity: voyage.cargo.quantity || "",
        grade: voyage.cargo.grade || "",
      },
      charter: {
        chartererName: voyage.charter.chartererName || "",
        charterPartyDate: voyage.charter.charterPartyDate || "",
        laycanStart: voyage.charter.laycanStart || "",
        laycanEnd: voyage.charter.laycanEnd || "",
      },
    });
    setOpenEdit(true);
  }

  async function handleUpdate() {
    if (!selectedVoyage || !editData) return;
    setSaving(true);

    try {
      const payload = {
        ...editData,
        // Ensure Numbers
        route: {
          ...editData.route,
          totalDistance: Number(editData.route.totalDistance),
        },
        cargo: { ...editData.cargo, quantity: Number(editData.cargo.quantity) },
      };

      const res = await fetch(`/api/voyages/${selectedVoyage._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      const responseData = await res.json();
      const updatedVoyage = responseData.report || responseData.data;

      setVoyages((prev) =>
        prev.map((v) => (v._id === updatedVoyage._id ? updatedVoyage : v)),
      );
      toast.success("Voyage updated successfully");
      setOpenEdit(false);
      setSelectedVoyage(null);
    } catch {
      toast.error("Failed to update voyage");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedVoyage) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/voyages/${selectedVoyage._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setVoyages((prev) => prev.filter((v) => v._id !== selectedVoyage._id));

      // UPDATE DYNAMIC COUNT ON DELETE
      if (setTotalCount) {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }

      toast.success("Voyage deleted successfully");
    } catch {
      toast.error("Failed to delete voyage");
    } finally {
      setOpenDelete(false);
      setSelectedVoyage(null);
      setIsDeleting(false); //  Stop Loading
    }
  }

  // --- Edit Form Helpers ---
  const handleEditChange = (key: keyof EditFormData, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [key]: value });
  };

  const handleNestedEditChange = (
    parent: "route" | "schedule" | "cargo" | "charter",
    key: string,
    value: any,
  ) => {
    if (!editData) return;
    setEditData({
      ...editData,
      [parent]: { ...editData[parent], [key]: value },
    });
  };

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={voyages}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (v: Voyage) => {
                      setSelectedVoyage(v);
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
        title="Voyage Details"
        headerRight={
          selectedVoyage && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">{selectedVoyage.voyageNo}</span>
              <span>|</span>
              <span>{selectedVoyage.vesselId?.name}</span>
            </div>
          )
        }
      >
        <div className="text-[13px] py-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* ROUTE INFO */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Route Information
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Load Port</span>
                <span className="font-medium">
                  {selectedVoyage?.route?.loadPort}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Discharge Port</span>
                <span className="font-medium">
                  {selectedVoyage?.route?.dischargePort}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Via</span>
                <span className="font-medium">
                  {selectedVoyage?.route?.via || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Distance</span>
                <span className="font-medium">
                  {selectedVoyage?.route?.totalDistance
                    ? `${selectedVoyage.route.totalDistance} NM`
                    : "-"}
                </span>
              </div>
            </section>

            {/* SCHEDULE */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Schedule
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Start Date</span>
                <span className="font-medium">
                  {formatDate(selectedVoyage?.schedule?.startDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">ETA</span>
                <span className="font-medium">
                  {formatDate(selectedVoyage?.schedule?.eta)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">End Date</span>
                <span className="font-medium">
                  {formatDate(selectedVoyage?.schedule?.endDate)}
                </span>
              </div>
            </section>

            {/* CARGO */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Cargo Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Commodity</span>
                <span className="font-medium">
                  {selectedVoyage?.cargo?.commodity || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium">
                  {selectedVoyage?.cargo?.quantity
                    ? `${selectedVoyage.cargo.quantity.toLocaleString()} MT`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Grade</span>
                <span className="font-medium">
                  {selectedVoyage?.cargo?.grade || "-"}
                </span>
              </div>
            </section>

            {/* CHARTER */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Charter Party
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Charterer</span>
                <span className="font-medium">
                  {selectedVoyage?.charter?.chartererName || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">CP Date</span>
                <span className="font-medium">
                  {selectedVoyage?.charter?.charterPartyDate || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Laycan</span>
                <span className="font-medium">
                  {selectedVoyage?.charter?.laycanStart || "?"} to{" "}
                  {selectedVoyage?.charter?.laycanEnd || "?"}
                </span>
              </div>
            </section>

            {/* AUDIT LOG */}
            <section className="md:col-span-2 space-y-1.5 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {typeof selectedVoyage?.createdBy === "object"
                      ? selectedVoyage.createdBy?.fullName
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedVoyage?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {typeof selectedVoyage?.updatedBy === "object"
                      ? selectedVoyage.updatedBy?.fullName
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedVoyage?.updatedAt)}
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
            <Badge
              color={
                selectedVoyage?.status === "active"
                  ? "success"
                  : selectedVoyage?.status === "scheduled"
                    ? "warning"
                    : "default"
              }
            >
              <span className="capitalize">{selectedVoyage?.status}</span>
            </Badge>
          </div>
        </div>
      </ViewModal>

      {/* ================= EDIT MODAL ================= */}
      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Voyage"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
            {/* GENERAL */}
            <ComponentCard title="General">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Vessel</Label>
                  <SearchableSelect
                    options={
                      vesselList?.map((v: any) => ({
                        value: v._id?.toString(),
                        label: v.name,
                      })) || []
                    }
                    value={editData.vesselId?.toString()}
                    onChange={(val) => handleEditChange("vesselId", val)}
                    placeholder="Search Vessel"
                  />
                </div>
                <InputField
                  label="Voyage No"
                  value={editData.voyageNo}
                  onChange={(e) => handleEditChange("voyageNo", e.target.value)}
                />
                <div>
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "scheduled", label: "Scheduled" },
                      { value: "active", label: "Active" },
                      { value: "completed", label: "Completed" },
                    ]}
                    value={editData.status}
                    onChange={(val) => handleEditChange("status", val)}
                  />
                </div>
              </div>
            </ComponentCard>

            {/* ROUTE */}
            <ComponentCard title="Route">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Load Port"
                  value={editData.route.loadPort}
                  onChange={(e) =>
                    handleNestedEditChange("route", "loadPort", e.target.value)
                  }
                />
                <InputField
                  label="Discharge Port"
                  value={editData.route.dischargePort}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "route",
                      "dischargePort",
                      e.target.value,
                    )
                  }
                />
                <InputField
                  label="Via"
                  value={editData.route.via}
                  onChange={(e) =>
                    handleNestedEditChange("route", "via", e.target.value)
                  }
                />
                <InputField
                  label="Distance (NM)"
                  type="number"
                  value={editData.route.totalDistance}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "route",
                      "totalDistance",
                      e.target.value,
                    )
                  }
                />
              </div>
            </ComponentCard>

            {/* SCHEDULE */}
            <ComponentCard title="Schedule">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={editData.schedule.startDate?.slice(0, 16)}
                    onChange={(e) =>
                      handleNestedEditChange(
                        "schedule",
                        "startDate",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>ETA</Label>
                  <Input
                    type="datetime-local"
                    value={editData.schedule.eta?.slice(0, 16)}
                    onChange={(e) =>
                      handleNestedEditChange("schedule", "eta", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={editData.schedule.endDate?.slice(0, 16)}
                    onChange={(e) =>
                      handleNestedEditChange(
                        "schedule",
                        "endDate",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* CHARTER & CARGO */}
            <ComponentCard title="Commercial">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Charterer"
                  value={editData.charter.chartererName}
                  onChange={(e) =>
                    handleNestedEditChange(
                      "charter",
                      "chartererName",
                      e.target.value,
                    )
                  }
                />
                <InputField
                  label="Commodity"
                  value={editData.cargo.commodity}
                  onChange={(e) =>
                    handleNestedEditChange("cargo", "commodity", e.target.value)
                  }
                />
                <InputField
                  label="Quantity (MT)"
                  type="number"
                  value={editData.cargo.quantity}
                  onChange={(e) =>
                    handleNestedEditChange("cargo", "quantity", e.target.value)
                  }
                />

                {/* Dates using DatePicker - Added IDs here */}
                <div>
                  <Label>Laycan Start</Label>
                  <DatePicker
                    id="edit-laycan-start" //  ADDED ID
                    defaultDate={editData.charter.laycanStart}
                    onChange={(_, date) =>
                      handleNestedEditChange("charter", "laycanStart", date)
                    }
                  />
                </div>
                <div>
                  <Label>Laycan End</Label>
                  <DatePicker
                    id="edit-laycan-end" //  ADDED ID
                    defaultDate={editData.charter.laycanEnd}
                    onChange={(_, date) =>
                      handleNestedEditChange("charter", "laycanEnd", date)
                    }
                  />
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
