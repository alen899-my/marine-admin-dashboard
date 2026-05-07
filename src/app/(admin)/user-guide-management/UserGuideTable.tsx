"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import UserGuideForm, {
  UserGuideFormValues,
} from "@/components/user-guide/UserGuideForm";
import { useAuthorization } from "@/hooks/useAuthorization";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { UserGuideSection } from "@/types/userGuide";

interface UserGuideTableProps {
  data: UserGuideSection[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface GroupOptionResponse {
  _id: string;
  name: string;
}

interface RoleOptionResponse {
  _id: string;
  name: string;
}

function getFormData(
  section: UserGuideSection,
): UserGuideFormValues {
  const hasExplicitRoleContent = Object.keys(section.roleContents || {}).length > 0;
  const roleContents: Record<string, string> = {};

  if (hasExplicitRoleContent) {
    (section.assignedRoles || []).forEach((role) => {
      const matchedEntry = Object.entries(section.roleContents || {}).find(
        ([entryRole]) => entryRole.toLowerCase() === role.toLowerCase(),
      );
      roleContents[role] = matchedEntry?.[1] || "";
    });
  } else {
    (section.assignedRoles || []).forEach((role) => {
      roleContents[role] = section.content || "";
    });
  }

  return {
    groupId: section.groupId,
    title: section.title,
    assignedRoles: section.assignedRoles || [],
    status: section.status,
    content: section.content || "",
    roleContents,
  };
}

function validateForm(data: UserGuideFormValues) {
  const errors: Partial<Record<keyof UserGuideFormValues, string>> = {};

  if (!data.groupId.trim()) errors.groupId = "Group is required";
  if (!data.title.trim()) errors.title = "Sub item title is required";
  if (!data.assignedRoles.length) errors.assignedRoles = "At least one role must be assigned";
  const missingRoles = data.assignedRoles.filter(
    (role) => !data.roleContents?.[role]?.trim(),
  );
  if (missingRoles.length > 0) {
    errors.roleContents = `Content is required for: ${missingRoles.join(", ")}`;
  }

  return errors;
}

function buildPayload(data: UserGuideFormValues) {
  const roleContents = data.assignedRoles.reduce<Record<string, string>>(
    (acc, role) => {
      acc[role] = data.roleContents?.[role] || "";
      return acc;
    },
    {},
  );

  const fallbackContent =
    data.content ||
    data.assignedRoles.map((role) => roleContents[role]).find((value) => value?.trim()) ||
    "";

  return {
    groupId: data.groupId,
    title: data.title,
    assignedRoles: data.assignedRoles,
    status: data.status,
    content: fallbackContent,
    roleContents,
  };
}

export default function UserGuideTable({
  data,
  pagination,
}: UserGuideTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();
  const canEdit = can("userguide.edit");
  const canDelete = can("userguide.delete");

  const [selectedSection, setSelectedSection] = useState<UserGuideSection | null>(null);
  const [editData, setEditData] = useState<UserGuideFormValues | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserGuideFormValues, string>>
  >({});
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [groupsRes, rolesRes] = await Promise.all([
          fetch("/api/user-guide-groups?limit=none&status=active"),
          fetch("/api/roles?limit=none&status=active"),
        ]);

        const groups = groupsRes.ok ? await groupsRes.json() : [];
        const rolesPayload = rolesRes.ok ? await rolesRes.json() : [];
        const roles = Array.isArray(rolesPayload) ? rolesPayload : rolesPayload.data || [];

        setGroupOptions(
          groups.map((group: GroupOptionResponse) => ({
            value: group._id,
            label: group.name,
          })),
        );
        setRoleOptions(
          roles.map((role: RoleOptionResponse) => ({
            value: role.name,
            label: role.name,
          })),
        );
      } catch {
        setGroupOptions([]);
        setRoleOptions([]);
      }
    }

    loadOptions();
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "S.No",
        render: (_row: UserGuideSection, index: number) =>
          (pagination.page - 1) * pagination.limit + index + 1,
      },
      {
        header: "Section",
        render: (row: UserGuideSection) => (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {row.group?.name || "Ungrouped"}
          </span>
        ),
      },
      {
        header: "Sub Item",
        render: (row: UserGuideSection) => (
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {row.title}
          </span>
        ),
      },
      {
        header: "Roles",
        render: (row: UserGuideSection) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {row.assignedRoles?.join(", ") || "No roles"}
          </span>
        ),
      },
  
      {
        header: "Status",
        render: (row: UserGuideSection) => (
          <Badge color={row.status === "active" ? "success" : "error"}>
            {row.status === "active" ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    [pagination.limit, pagination.page],
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleEdit = (section: UserGuideSection) => {
    setSelectedSection(section);
    setEditData(getFormData(section));
    setErrors({});
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedSection || !editData) return;

    const nextErrors = validateForm(editData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/user-guide/${selectedSection._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(editData)),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user guide");
      }

      toast.success("User guide updated successfully");
      setOpenEdit(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user guide",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSection) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/user-guide/${selectedSection._id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user guide");
      }

      toast.success("User guide deleted successfully");
      setOpenDelete(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user guide",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!isReady) return null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onRowClick={(row) => {
                setSelectedSection(row);
                setOpenView(true);
              }}
              onView={(row) => {
                setSelectedSection(row);
                setOpenView(true);
              }}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (row) => {
                      setSelectedSection(row);
                      setOpenDelete(true);
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title={selectedSection?.title || "User Guide Details"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Section</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {selectedSection?.group?.name || "Ungrouped"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Assigned Roles</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                {selectedSection?.assignedRoles?.join(", ") || "No roles"}
              </p>
            </div>
          </div>

          {selectedSection &&
          Object.keys(selectedSection.roleContents || {}).length > 0 ? (
            <div className="space-y-5">
              {selectedSection.assignedRoles.map((role) => {
                const matchedEntry = Object.entries(
                  selectedSection.roleContents || {},
                ).find(([entryRole]) => entryRole.toLowerCase() === role.toLowerCase());
                const roleContent = matchedEntry?.[1] || "";

                return (
                  <div key={role}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {role} content
                    </p>
                    <div
                      className="rte-content text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: roleContent }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rte-content text-sm leading-relaxed text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: selectedSection?.content || "" }}
            />
          )}
        </div>
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit User Guide"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[72vh] space-y-5 overflow-y-auto p-1 custom-scrollbar">
            <ComponentCard title="">
              <UserGuideForm
                data={editData}
                groupOptions={groupOptions}
                roleOptions={roleOptions}
                errors={errors}
                onChange={(key, value) =>
                  setEditData((prev) => (prev ? { ...prev, [key]: value } : prev))
                }
              />
            </ComponentCard>
          </div>
        )}
      </EditModal>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User Guide"
        description={`Are you sure you want to delete "${selectedSection?.title || "this user guide"}"?`}
      />
    </>
  );
}
