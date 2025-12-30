"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
import AddForm from "@/components/common/AddForm";
import UserCardComponent from "@/components/Users/UserCardComponent";
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import { userSchema } from "@/lib/validations/uservalidation/userSchema";
import Alert from "@/components/ui/alert/Alert"; 

import UserDetailsForm from "./components/UserDetailsForm";
import RoleSelectionList from "./components/RoleSelectionList";
import PermissionMatrixTable from "./components/PermissionMatrixTable";
import PermissionLegend from "./components/PermissionLegend";
import { useAuthorization } from "@/hooks/useAuthorization";
import DashboardWidgetSectionUser from "@/components/Users/DashboardWidgetSectionUser";
// --- Types ---
interface IUser {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  role: any;
  status: string;
  additionalPermissions?: string[];
  excludedPermissions?: string[];
  profilePicture?: string;
}

interface RoleData {
  _id: string;
  name: string;
  
  description?: string;
  permissions?: string[];
}

interface UserFormModalProps {
  isOpen: boolean;
 onClose: () => void;
  onSuccess?: () => void;
  initialData?: IUser | null;
}

interface IPermission {
  _id: string;
  slug: string;
  description?: string;
  group: string;
}

export default function UserFormModal({ isOpen, onClose, onSuccess, initialData }: UserFormModalProps) {
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const { can, isReady } = useAuthorization();
  const isEditMode = !!initialData || !!createdUserId;
  const currentUserId = initialData?._id || createdUserId;
  const canEdit = can("users.edit");
  // ✅ CHANGED: Use an object to control Title/Message dynamically
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"details" | "roles">("details");
  
  const [rolesList, setRolesList] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false); 
  
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [additionalPerms, setAdditionalPerms] = useState<string[]>([]);
  const [excludedPerms, setExcludedPerms] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const defaultState = {
    name: "",
    email: "",
    phone: "",
    role: "", 
    status: "active",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState(defaultState);

  // --- Reset State ---
  useEffect(() => {
    if (!isOpen) {
      setCreatedUserId(null);
      setAlertConfig(null); // ✅ Reset alert
      setActiveTab("details");
      setErrors({});
      setHasChanges(false);
    }
  }, [isOpen]);

const handleClose = () => {
  setHasChanges(false);  // reset changes so closing won’t refresh/update
  onClose?.();           // close only when user clicks close
};

  // --- 1. Fetch Roles ---
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/roles");
        if (res.ok) {
          const json = await res.json();
          const roles = json.data || [];
          setRolesList(roles);

          if (!initialData && isOpen && !createdUserId) {
             const defaultRole = roles.find((r: RoleData) => 
               r.name.toLowerCase() === "op-staff" || r.name.toLowerCase() === "op staff"
             );
             
             if (defaultRole) {
                setFormData(prev => ({ ...prev, role: defaultRole._id }));
                setSelectedRolePermissions(defaultRole.permissions || []);
             }
          }
        }
      } catch (error) {
        console.error("Failed to load roles", error);
      }
    }
    if (isOpen) fetchRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); 

  // --- 2. Fetch Permissions ---
  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const data = await res.json();
          setAllPermissions(data);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    }
    if (isOpen) fetchPermissions();
  }, [isOpen]);

  // --- 3. Initialize Data ---
  useEffect(() => {
    if (isOpen && initialData) {
      const roleId = typeof initialData.role === 'object' && initialData.role ? initialData.role._id : initialData.role;
      if (initialData.profilePicture) {
        setImagePreview(initialData.profilePicture);
      } else {
        setImagePreview(null);
      }
      setProfileImage(null); // Reset file input
      setFormData({
        name: initialData.fullName,
        email: initialData.email,
        phone: initialData.phone || "",
        role: roleId || "",
        status: initialData.status || "active",
        password: "",
        confirmPassword: "",
      });

      setAdditionalPerms(initialData.additionalPermissions || []);
      setExcludedPerms(initialData.excludedPermissions || []);

      if (typeof initialData.role === 'object' && initialData.role.permissions) {
         setSelectedRolePermissions(initialData.role.permissions);
      } else if (roleId) {
         const roleObj = rolesList.find(r => r._id === roleId);
         if (roleObj) setSelectedRolePermissions(roleObj.permissions || []);
      }
    } else if (isOpen && !initialData && !createdUserId) {
      setFormData(defaultState);
      setImagePreview(null);
      setProfileImage(null);
      setAdditionalPerms([]);
      setExcludedPerms([]);
    }
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, rolesList]);

  const selectedRoleObj = rolesList.find(r => r._id === formData.role);
  const isSuperAdmin = selectedRoleObj?.name?.toLowerCase() === "super-admin";


  useEffect(() => {
  if (!isSuperAdmin) return;

  // Super Admin always has ALL permissions
  const allSlugs = allPermissions.map(p => p.slug);

  setSelectedRolePermissions(allSlugs);
  setAdditionalPerms([]);
  setExcludedPerms([]);
}, [isSuperAdmin, allPermissions]);
  // --- HANDLERS ---
 const togglePermission = async (slug: string) => {
  if (isSuperAdmin) {
    toast.info("Super Admin permissions cannot be modified");
    return;
  }
    const isRolePermission = selectedRolePermissions.includes(slug);
    const isAdditional = additionalPerms.includes(slug);
    const isExcluded = excludedPerms.includes(slug);

    let newAdditional = [...additionalPerms];
    let newExcluded = [...excludedPerms];

    if (isRolePermission) {
      if (isExcluded) {
        newExcluded = newExcluded.filter(p => p !== slug);
      } else {
        newExcluded = [...newExcluded, slug];
        newAdditional = newAdditional.filter(p => p !== slug); 
      }
    } else {
      if (isAdditional) {
        newAdditional = newAdditional.filter(p => p !== slug);
      } else {
        newAdditional = [...newAdditional, slug];
        newExcluded = newExcluded.filter(p => p !== slug);
      }
    }

    setAdditionalPerms(newAdditional);
    setExcludedPerms(newExcluded);
    setHasChanges(true); 

    if (currentUserId) {
      try {
        const formDataPayload = new FormData();
      formDataPayload.append("additionalPermissions", JSON.stringify(newAdditional));
      formDataPayload.append("excludedPermissions", JSON.stringify(newExcluded));
        await fetch(`/api/users/${currentUserId}`, {
          method: "PATCH",
          
          body: formDataPayload,
        });
        onSuccess?.();
      } catch (error) {
        console.error("Auto-save failed", error);
        toast.error("Failed to save permission");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleImageChange = (file: File) => {
    setProfileImage(file);
    // Create a local preview URL
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };
const handleTabChange = (tab: "details" | "roles") => {
    // If trying to go to Roles tab, but user is NOT created/editing yet
    if (tab === "roles" && !isEditMode) {
      toast.error("Please create the User Details first.");
      return; 
    }
    setActiveTab(tab);
  };
const handleRoleChange = async (roleId: string) => {
   
    const isUnchecking = formData.role === roleId;
    const newRoleId = isUnchecking ? "" : roleId;

    // 1. Get the new role's native permissions
    const roleObj = rolesList.find(r => r._id === newRoleId);
    const newRolePerms = roleObj?.permissions || []; 

    // 2. --- CLEANUP LOGIC START ---
    
    // A. Clean Additional: If the new role ALREADY has this permission, remove it from 'additional'
    const cleanedAdditional = additionalPerms.filter(slug => !newRolePerms.includes(slug));

    // B. Clean Excluded: If the new role DOES NOT have this permission, we can't exclude it, so remove it.
    const cleanedExcluded = excludedPerms.filter(slug => newRolePerms.includes(slug));

    // --- CLEANUP LOGIC END ---

    // 3. Update Local State
    setFormData((prev) => ({ ...prev, role: newRoleId }));
    setSelectedRolePermissions(newRolePerms); 
    
    // Set the cleaned versions!
    setAdditionalPerms(cleanedAdditional); 
    setExcludedPerms(cleanedExcluded);
    
    setHasChanges(true); 

    // 4. Send Cleaned Data to Backend
    if (currentUserId && newRoleId) {
      try {
        const formDataPayload = new FormData();
        formDataPayload.append("role", newRoleId);
        formDataPayload.append("additionalPermissions", JSON.stringify(cleanedAdditional));
        formDataPayload.append("excludedPermissions", JSON.stringify(cleanedExcluded));
        await fetch(`/api/users/${currentUserId}`, {
          method: "PATCH",
         
         body: formDataPayload,
        });
        onSuccess?.();
      } catch (error) {
        toast.error("Failed to update role");
      }
    }
  };

const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);
    const newErrors: Record<string, string> = {};

    // --- 1. Validation Logic (Standard checks) ---
    if (isEditMode) {
      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    const { error } = userSchema.validate(formData, { abortEarly: false, allowUnknown: true });
    if (error) {
      error.details.forEach((err) => {
        if (isEditMode && (err.path[0] === 'password' || err.path[0] === 'confirmPassword') && !formData.password) return;
        if (!isEditMode && err.path[0] === 'role') return;
        if (err.path[0]) newErrors[err.path[0] as string] = err.message;
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      if (newErrors.role) {
        setActiveTab("roles");
        toast.error("Please select a Role");
      } else {
        setActiveTab("details");
        toast.error("Please fix errors in User Details");
      }
      return;
    }

    try {
      // ✅ 2. Construct FormData for File Upload
      const formDataPayload = new FormData();

      // Append standard text fields
      formDataPayload.append("name", formData.name);
      formDataPayload.append("email", formData.email);
      formDataPayload.append("phone", formData.phone || "");
      formDataPayload.append("role", formData.role);
      formDataPayload.append("status", formData.status);

      // Only append password if it was entered
      if (formData.password) {
        formDataPayload.append("password", formData.password);
      }

      // Append Arrays (FormData requires strings, so we JSON.stringify arrays)
      formDataPayload.append("additionalPermissions", JSON.stringify(additionalPerms));
      formDataPayload.append("excludedPermissions", JSON.stringify(excludedPerms));

      // ✅ 3. Append the File (if one was selected)
      if (profileImage) {
        formDataPayload.append("profilePicture", profileImage);
      }

      // Determine URL and Method
      const url = isEditMode ? `/api/users/${currentUserId}` : "/api/users";
      
      // Note: Ensure your backend PATCH route handles FormData (req.formData()) just like POST does.
      const method = isEditMode ? "PATCH" : "POST"; 

      const res = await fetch(url, {
        method,
        // ❌ IMPORTANT: Do NOT set "Content-Type": "application/json" manually.
        // The browser automatically sets the correct Multipart Boundary for FormData.
        body: formDataPayload,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed");

      // --- Success Logic ---
      if (initialData || createdUserId) {
        toast.success("User updated successfully!");
        onSuccess?.();
        setAlertConfig({
          title: "User Updated Successfully",
          message: "Your changes have been saved."
        });
      } else {
        setCreatedUserId(data.userId); 
        setAlertConfig({
          title: "User Created Successfully",
          message: "You can now edit permissions below."
        });
        setActiveTab("roles");         
      }

      if (data.roleId) {
        setFormData(prev => ({ ...prev, role: data.roleId }));
        const assignedRole = rolesList.find(r => r._id === data.roleId);
        if (assignedRole) {
          setSelectedRolePermissions(assignedRole.permissions || []);
        }
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const DetailsTab = (
    <UserDetailsForm 
      formData={formData}
      errors={errors}
      isEditMode={isEditMode}
      onChange={handleChange}
      onStatusChange={(val) => setFormData(prev => ({...prev, status: val}))}
      imagePreview={imagePreview}
      onImageChange={handleImageChange}
    />
  );

  const RolesTab = (
    <div className="">
      <RoleComponentCard title="">
         <RoleSelectionList 
            rolesList={rolesList} 
            selectedRoleId={formData.role} 
            onRoleChange={handleRoleChange} 
         />
      </RoleComponentCard>

     {formData.role && (
  <RoleComponentCard 
    title="Permissions"
    desc={
      isSuperAdmin
        ? "All permissions are automatically granted for Super Admin."
        : isEditMode
          ? "Click icons to modify permissions."
          : "View permissions for this role."
    }
    legend={
      !isSuperAdmin ? <PermissionLegend showAll={isEditMode} /> : null
    }
  >
    <div className="space-y-6">
          
        

          <PermissionMatrixTable 
            allPermissions={allPermissions}
            rolePermissions={selectedRolePermissions}
            additionalPermissions={additionalPerms}
            excludedPermissions={excludedPerms}
            onToggle={togglePermission}
            isReadOnly={!isEditMode || isSuperAdmin}
          />
           <DashboardWidgetSectionUser 
             rolePermissions={selectedRolePermissions}
             additionalPermissions={additionalPerms}
             excludedPermissions={excludedPerms}
             onToggle={togglePermission} // Uses the exact same logic as the grid
             isReadOnly={!isEditMode || isSuperAdmin}
          />
        </div>
  </RoleComponentCard>
)}

    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[850px] p-4 sm:p-6">
      <AddForm
  title={initialData ? "Edit User" : (createdUserId ? "Edit Permissions" : "Add New User")}
  description={isEditMode ? "Update details and permissions" : "Enter user details to create account"}
  
  submitLabel={
    isSubmitting 
      ? "Saving..." 
      : activeTab === "roles" 
        ? "Save Role" // or "Add Role"
        : (initialData || createdUserId ? "Update User" : "Create User")
  }
  onCancel={handleClose}
  onSubmit={handleSubmit}
>
        <div className="max-h-[75vh] overflow-y-auto p-1 space-y-4">
          
          {/* ✅ DYNAMIC SUCCESS ALERT */}
          {alertConfig && (
            <Alert 
              variant="success"
              title={alertConfig.title}
              message={alertConfig.message}
            />
          )}

          <UserCardComponent
  userDetails={DetailsTab}
  userRoles={RolesTab}
  activeTab={activeTab}
  onTabChange={handleTabChange} // <--- ADD THIS
/>
        </div>
      </AddForm>
    </Modal>
  );
}