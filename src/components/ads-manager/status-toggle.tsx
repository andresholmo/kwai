"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface StatusToggleProps {
  isActive: boolean;
  onToggle: (newStatus: boolean) => Promise<void>;
  disabled?: boolean;
}

export function StatusToggle({
  isActive,
  onToggle,
  disabled,
}: StatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(isActive);

  const handleToggle = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      await onToggle(!checked);
      setChecked(!checked);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleToggle}
      disabled={disabled}
      className="data-[state=checked]:bg-blue-600"
    />
  );
}

