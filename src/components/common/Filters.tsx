"use client";

import DatePicker from "@/components/form/date-picker";
import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

// Define the Props Interface
interface FilterProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  searchVessel?: boolean;
  searchVoyage?: boolean;
  optionOff?: boolean;
  vesselId: string;
  setVesselId: (v: string) => void;
  voyageId: string;
  setVoyageId: (v: string) => void;
  vessels: any[];         
}

export default function Filters({
  search,
  setSearch,
  status,
  setStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchVessel,
  searchVoyage,
  optionOff,
  vesselId,
  setVesselId,
  voyageId,
  setVoyageId,
  vessels = [], // Default to empty array here as well
}: FilterProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [localVesselId, setLocalVesselId] = useState(vesselId);
  const [localVoyageId, setLocalVoyageId] = useState(voyageId);
  const [voyageList, setVoyageList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);
  useEffect(() => { setLocalStartDate(startDate); }, [startDate]);
  useEffect(() => { setLocalEndDate(endDate); }, [endDate]);
  useEffect(() => { setLocalVesselId(vesselId); }, [vesselId]);
  useEffect(() => { setLocalVoyageId(voyageId); }, [voyageId]);

  useEffect(() => {
    async function fetchAndFilterVoyages() {
      if (!localVesselId) {
        setVoyageList([]);
        return;
      }
      try {
        const res = await fetch(`/api/voyages?vesselId=${localVesselId}`);
        if (res.ok) {
          const result = await res.json();
          const allVoyages = Array.isArray(result) ? result : result.data || [];
          setVoyageList(
  allVoyages.map((v: any) => ({
    value: v._id,
    label: v.voyageNo,
  }))
);
        }
      } catch (error) {
        setVoyageList([]);
      }
    }
    fetchAndFilterVoyages();
  }, [localVesselId]);

  const handleApplyFilters = () => {
    setSearch(localSearch);
    setStatus(localStatus);
    setStartDate(localStartDate);
    setEndDate(localEndDate);
    setVesselId(localVesselId);
    setVoyageId(localVoyageId);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalStartDate("");
    setLocalEndDate("");
    setLocalVesselId("");
    setLocalVoyageId("");
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setVesselId("");
    setVoyageId("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  const getStatusOptions = () => {
    if (searchVessel) {
      return [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "laid_up", label: "Laid Up" },
        { value: "sold", label: "Sold" },
        { value: "dry_dock", label: "Dry Dock" },
      ];
    }
    if (searchVoyage) {
      return [
        { value: "all", label: "All Status" },
        { value: "scheduled", label: "Scheduled" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ];
    }
    return [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ];
  };

  const getSearchPlaceholder = () => {
    if (searchVessel) return "Search by Name, IMO or Fleet";
    if (searchVoyage) return "Search by Voyage No, Port or Vessel";
    return "Search by Vessel Name or Voyage ID";
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      <div className="flex-1 min-w-[200px] max-w-full lg:max-w-md">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Search
        </label>
        <Input
          placeholder={getSearchPlaceholder()}
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* FIXED: Added fallback (vessels || []) to prevent map error */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Vessel Name
        </label>
        <SearchableSelect
          options={(vessels || []).map((v: any) => ({
            value: v.name,
            label: v.name,
          }))}
          placeholder="Select Vessel"
          value={(vessels || []).find(v => v._id === localVesselId)?.name || ""}
          onChange={(selectedName) => {
            const selectedVessel = (vessels || []).find((v: any) => v.name === selectedName);
            setLocalVesselId(selectedVessel?._id || "");
            setLocalVoyageId("");
          }}
        />
      </div>

      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Voyage ID
        </label>
        <SearchableSelect
          options={voyageList}
          placeholder={!localVesselId ? "Select Vessel first" : "Search Voyage"}
          value={localVoyageId}
          onChange={setLocalVoyageId}
        />
      </div>

      <div className="w-full sm:w-auto min-w-[160px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Status
        </label>
        <Select
          className="w-full"
          value={localStatus}
          onChange={setLocalStatus}
          placeholder="Select status"
          options={getStatusOptions()}
        />
      </div>

      {!optionOff && (
        <>
          <div className="w-full sm:w-auto min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
              {searchVoyage ? "ETA From" : "Date From"}
            </label>
            <DatePicker
              key={localStartDate}
              id="filter-start-date"
              placeholder="dd/mm/yyyy"
              defaultDate={localStartDate}
              onChange={(_, dateStr) => setLocalStartDate(dateStr)}
            />
          </div>
          <div className="w-full sm:w-auto min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
              {searchVoyage ? "ETA To" : "Date To"}
            </label>
            <DatePicker
              key={localEndDate}
              id="filter-end-date"
              placeholder="dd/mm/yyyy"
              defaultDate={localEndDate}
              onChange={(_, dateStr) => setLocalEndDate(dateStr)}
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <button
          onClick={handleApplyFilters}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Search
        </button>
        <button
          onClick={handleClear}
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Reset
        </button>
      </div>
    </div>
  );
}