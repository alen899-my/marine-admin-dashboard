"use client";
import Button from "@/components/ui/button/Button";
import { Filter, FunnelX } from "lucide-react";

interface Props {
  isVisible: boolean;
  onToggle: (v: boolean) => void;
}

export default function FilterToggleButton({ isVisible, onToggle }: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="p-1 min-w-[40px] h-[48px]"
      onClick={() => onToggle(!isVisible)}
      startIcon={isVisible ? <FunnelX size={20} /> : <Filter size={20} />}
    >
      {null}
    </Button>
  );
}