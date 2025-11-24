"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, Copy, Trash2, X } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActivate: () => void;
  onPause: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  loading?: boolean;
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  onActivate,
  onPause,
  onDuplicate,
  onDelete,
  loading,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <span className="text-sm font-medium text-blue-800">
        {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
      </span>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-blue-300 mx-2" />

      <Button variant="outline" size="sm" onClick={onActivate} disabled={loading}>
        <Play className="h-4 w-4 mr-1" />
        Ativar
      </Button>

      <Button variant="outline" size="sm" onClick={onPause} disabled={loading}>
        <Pause className="h-4 w-4 mr-1" />
        Pausar
      </Button>

      <Button variant="outline" size="sm" onClick={onDuplicate} disabled={loading}>
        <Copy className="h-4 w-4 mr-1" />
        Duplicar
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Excluir
      </Button>
    </div>
  );
}

