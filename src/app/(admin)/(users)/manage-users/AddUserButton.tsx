"use client";

import Button from "@/components/ui/button/Button";
import UserFormModal from "@/components/Users/UserFormModal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useState } from "react";

export default function AddUserButton({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { can, isReady } = useAuthorization();

  if (!isReady) return null;

  // 🔒 RBAC: only users.create
  if (!can("users.create")) return null;

  return (
    <>
      <Button size="md" variant="primary" onClick={() => setIsOpen(true)}>
        Add User
      </Button>

      <UserFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={onSuccess}
        initialData={null}
      />
    </>
  );
}
