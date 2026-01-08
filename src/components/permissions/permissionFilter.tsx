"use client";

import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import Button from "@/components/ui/button/Button"; // ✅ Use your shared Button component
interface ModuleOption {
  id: string;
  name: string;
}
interface PermissionFilterProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  module: string; 
  setModule: (v: string) => void;
 modules: ModuleOption[];
}


export default function PermissionFilter({
  search,
  setSearch,
  status,
  setStatus,
  module,
  setModule,
  modules = [],
}: PermissionFilterProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localModule, setLocalModule] = useState(module);

  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);
  useEffect(() => { setLocalModule(module); }, [module]);

  const handleApplyFilters = () => {
    setSearch(localSearch);
    setStatus(localStatus);
    setModule(localModule);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalModule("");
    setSearch("");
    setStatus("all");
    setModule("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[250px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Permission
        </label>
        <Input
          placeholder="Search by name or slug..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* STATUS */}
      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Status
        </label>
        <Select
          className="w-full"
          value={localStatus}
          onChange={setLocalStatus}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      {/* MODULE / GROUP */}
      <div className="w-full sm:w-auto min-w-[220px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Resource 
        </label>
        <SearchableSelect
  options={modules.map((m) => ({
    value: m.id,               // This is what is sent to the backend
    label: m.name
  }))}
  placeholder="All Resource"
  value={localModule}          // localModule will now hold the ID
  onChange={setLocalModule}
/>
      </div>

      {/* ACTION BUTTONS (Using the shared Button component) */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <Button
          size="md"
          variant="primary"
          onClick={handleApplyFilters}
          className="px-6"
        >
          Search
        </Button>
        <Button
          size="md"
          variant="outline"
          onClick={handleClear}
          className="px-6"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}