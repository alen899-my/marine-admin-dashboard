"use client";

import SearchableMultiSelect from "@/components/form/SearchableMultiSelect";
import SearchableSelect from "@/components/form/SearchableSelect";
import RichTextEditor from "@/components/form/RichTextEditor";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

export interface UserGuideFormValues {
  groupId: string;
  title: string;
  assignedRoles: string[];
  status: "active" | "inactive";
  content: string;
  roleContents: Record<string, string>;
}

interface Option {
  value: string;
  label: string;
}

interface UserGuideFormProps {
  data: UserGuideFormValues;
  groupOptions: Option[];
  roleOptions: Option[];
  errors?: Partial<Record<keyof UserGuideFormValues, string>>;
  onChange: <K extends keyof UserGuideFormValues>(
    key: K,
    value: UserGuideFormValues[K],
  ) => void;
}

export const emptyUserGuideForm: UserGuideFormValues = {
  groupId: "",
  title: "",
  assignedRoles: [],
  status: "active",
  content: "",
  roleContents: {},
};

export default function UserGuideForm({
  data,
  groupOptions,
  roleOptions,
  errors = {},
  onChange,
}: UserGuideFormProps) {
  const handleRolesChange = (selectedRoles: string[]) => {
    const nextRoleContents = selectedRoles.reduce<Record<string, string>>(
      (acc, role) => {
        acc[role] = data.roleContents?.[role] ?? data.content ?? "";
        return acc;
      },
      {},
    );

    onChange("assignedRoles", selectedRoles);
    onChange("roleContents", nextRoleContents);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label>Group *</Label>
          <SearchableSelect
            options={groupOptions}
            value={data.groupId}
            onChange={(value) => onChange("groupId", value)}
            placeholder="Search and select group..."
            error={!!errors.groupId}
          />
          {errors.groupId && (
            <p className="mt-1 text-xs text-error-500">{errors.groupId}</p>
          )}
        </div>

        <div>
          <Label>Sub Item *</Label>
          <Input
            placeholder="e.g. Daily Noon Report"
            value={data.title}
            onChange={(event) => onChange("title", event.target.value)}
            error={!!errors.title}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-error-500">{errors.title}</p>
          )}
        </div>

        <div>
          <Label>Assigned Roles *</Label>
          <SearchableMultiSelect
            options={roleOptions}
            value={data.assignedRoles}
            onChange={handleRolesChange}
            placeholder="Search and select roles..."
            error={!!errors.assignedRoles}
          />
          {errors.assignedRoles && (
            <p className="mt-1 text-xs text-error-500">{errors.assignedRoles}</p>
          )}
        </div>

        <div>
          <Label>Status *</Label>
          <Select
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={data.status}
            onChange={(value) => onChange("status", value as "active" | "inactive")}
            error={!!errors.status}
          />
          {errors.status && (
            <p className="mt-1 text-xs text-error-500">{errors.status}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Role-Specific Content </Label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Each selected role can have its own guide content. Users only see the content for their role.
          </p>
          {errors.roleContents && (
            <p className="mt-2 text-xs text-error-500">{errors.roleContents}</p>
          )}
        </div>

        {data.assignedRoles.length > 0 ? (
          <div className="space-y-5">
            {data.assignedRoles.map((role) => (
              <div key={role}>
                <Label>{role} Content </Label>
               
                  <RichTextEditor
                    value={data.roleContents?.[role] || ""}
                    onChange={(value) =>
                      onChange("roleContents", {
                        ...data.roleContents,
                        [role]: value,
                      })
                    }
                    placeholder={`Write the guide content shown only to ${role}...`}
                    error={!!errors.roleContents}
                  />
                </div>
             
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Select one or more roles to start writing role-specific content.
          </div>
        )}
      </div>
    </div>
  );
}
