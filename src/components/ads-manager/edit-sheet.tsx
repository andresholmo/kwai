"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { microToReais, reaisToMicro } from "@/lib/utils";

interface EditSheetProps {
  open: boolean;
  onClose: () => void;
  type: "campaign" | "adset" | "ad";
  data: any;
  onSave: (data: any) => Promise<void>;
}

export function EditSheet({
  open,
  onClose,
  type,
  data,
  onSave,
}: EditSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        // Converter micro-reais para reais para exibição
        budgetDisplay: data.campaignBudget
          ? microToReais(data.campaignBudget)
          : "",
        bidDisplay: data.bid ? microToReais(data.bid) : "",
      });
    }
  }, [data]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        // Converter de volta para micro-reais
        campaignBudget: formData.budgetDisplay
          ? reaisToMicro(parseFloat(formData.budgetDisplay))
          : undefined,
        bid: formData.bidDisplay
          ? reaisToMicro(parseFloat(formData.bidDisplay))
          : undefined,
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    campaign: "Editar Campanha",
    adset: "Editar Conjunto de Anúncios",
    ad: "Editar Anúncio",
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{titles[type]}</SheetTitle>
          <SheetDescription>
            Faça alterações e clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {formData.openStatus === 1 ? "Ativo" : "Pausado"}
              </span>
              <Switch
                checked={formData.openStatus === 1}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, openStatus: checked ? 1 : 2 })
                }
              />
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={
                formData.campaignName ||
                formData.unitName ||
                formData.creativeName ||
                ""
              }
              onChange={(e) => {
                const key =
                  type === "campaign"
                    ? "campaignName"
                    : type === "adset"
                    ? "unitName"
                    : "creativeName";
                setFormData({ ...formData, [key]: e.target.value });
              }}
            />
          </div>

          {/* Campos específicos por tipo */}
          {type === "campaign" && (
            <>
              <div className="space-y-2">
                <Label>Tipo de Orçamento</Label>
                <Select
                  value={formData.campaignBudgetType?.toString() || "1"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      campaignBudgetType: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Diário</SelectItem>
                    <SelectItem value="2">Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orçamento (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.budgetDisplay || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetDisplay: e.target.value })
                  }
                  placeholder="Ex: 200.00"
                />
              </div>
            </>
          )}

          {type === "adset" && (
            <>
              <div className="space-y-2">
                <Label>URL de Destino</Label>
                <Input
                  value={formData.websiteUrl || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Bid (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.bidDisplay || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bidDisplay: e.target.value })
                  }
                  placeholder="Ex: 0.10"
                />
              </div>

              <div className="space-y-2">
                <Label>Orçamento Diário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    formData.dayBudget
                      ? microToReais(formData.dayBudget)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dayBudget: reaisToMicro(parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="Sem limite"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

