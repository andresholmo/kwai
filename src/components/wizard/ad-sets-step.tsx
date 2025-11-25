"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { reaisToMicro } from "@/lib/utils";

export function AdSetsStep({ data, onUpdate }: any) {
  const [conversions, setConversions] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    unitName: "",
    websiteUrl: "",
    optimizationGoal: 1,
    bidType: 1,
    bid: "",
    dayBudget: "",
    gender: 3,
    conversionId: undefined as number | undefined,
  });

  // Função para buscar conversões quando optimization mudar para 'conversions'
  const fetchConversions = async () => {
    if (!data.campaign?.accountId) return;

    try {
      const res = await fetch(
        `/api/kwai/pixels?accountId=${data.campaign.accountId}&marketingType=2`
      );
      const dataRes = await res.json();

      if (dataRes.success) {
        setConversions(dataRes.conversions || []);
      }
    } catch (error) {
      console.error("Erro ao buscar conversões:", error);
      setConversions([]);
    }
  };

  // Chamar quando ad set mudar optimization para conversions
  useEffect(() => {
    const hasConversionOptimization =
      formData.optimizationGoal === 3 || data.adSets.some((adSet: any) => adSet.optimizationGoal === 3);
    if (hasConversionOptimization && conversions.length === 0 && data.campaign?.accountId) {
      fetchConversions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.optimizationGoal, data.adSets, data.campaign?.accountId]);

  const handleAdd = () => {
    if (!formData.unitName || !formData.websiteUrl || !formData.bid) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    // Validar conversão quando otimização é conversões
    if (formData.optimizationGoal === 3 && !formData.conversionId) {
      alert("Meta de Conversão é obrigatória quando a otimização é Conversões");
      return;
    }

    const newAdSet = {
      ...formData,
      bid: reaisToMicro(parseFloat(formData.bid)),
      dayBudget: formData.dayBudget ? reaisToMicro(parseFloat(formData.dayBudget)) : undefined,
      conversionId: formData.conversionId,
    };

    if (editingIndex !== null) {
      const updated = [...data.adSets];
      updated[editingIndex] = newAdSet;
      onUpdate({ ...data, adSets: updated });
      setEditingIndex(null);
    } else {
      onUpdate({ ...data, adSets: [...data.adSets, newAdSet] });
    }

    // Reset form
    setFormData({
      unitName: "",
      websiteUrl: "",
      optimizationGoal: 1,
      bidType: 1,
      bid: "",
      dayBudget: "",
      gender: 3,
      conversionId: undefined,
    });
  };

  const handleEdit = (index: number) => {
    const adSet = data.adSets[index];
    setFormData({
      ...adSet,
      bid: (adSet.bid / 1000000).toString(),
      dayBudget: adSet.dayBudget ? (adSet.dayBudget / 1000000).toString() : "",
      conversionId: adSet.conversionId,
    });
    setEditingIndex(index);
  };

  const handleRemove = (index: number) => {
    onUpdate({
      ...data,
      adSets: data.adSets.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Nome do Conjunto *</Label>
            <Input
              value={formData.unitName}
              onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
              placeholder="Ex: Público Geral"
            />
          </div>

          <div className="space-y-2">
            <Label>URL de Destino *</Label>
            <Input
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Otimização</Label>
              <Select
                value={formData.optimizationGoal.toString()}
                onValueChange={(v) => setFormData({ ...formData, optimizationGoal: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Cliques</SelectItem>
                  <SelectItem value="2">Impressões</SelectItem>
                  <SelectItem value="3">Conversões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Lance</Label>
              <Select
                value={formData.bidType.toString()}
                onValueChange={(v) => setFormData({ ...formData, bidType: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">CPC</SelectItem>
                  <SelectItem value="2">CPM</SelectItem>
                  <SelectItem value="10">oCPM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select
                value={formData.gender.toString()}
                onValueChange={(v) => setFormData({ ...formData, gender: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Masculino</SelectItem>
                  <SelectItem value="2">Feminino</SelectItem>
                  <SelectItem value="3">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {formData.optimizationGoal === 3 ? "CPA (R$)" : "Lance (R$)"} *
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.bid}
                onChange={(e) => setFormData({ ...formData, bid: e.target.value })}
                placeholder="0,50"
              />
            </div>

            <div className="space-y-2">
              <Label>Orçamento Diário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.dayBudget}
                onChange={(e) => setFormData({ ...formData, dayBudget: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Meta de Conversão - só aparece se optimization for 'conversions' */}
          {formData.optimizationGoal === 3 && (
            <div className="space-y-2">
              <Label>Meta de Conversão *</Label>
              {conversions.length > 0 ? (
                <Select
                  value={formData.conversionId?.toString() || undefined}
                  onValueChange={(val) =>
                    setFormData({ ...formData, conversionId: parseInt(val) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma meta de conversão" />
                  </SelectTrigger>
                  <SelectContent>
                    {conversions.map((conv: any) => (
                      <SelectItem
                        key={conv.convertId || conv.id}
                        value={(conv.convertId || conv.id)?.toString()}
                      >
                        {conv.convertName || conv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Nenhuma meta de conversão encontrada.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure metas de conversão no Kwai Ads Manager primeiro.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleAdd} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {editingIndex !== null ? "Atualizar Conjunto" : "Adicionar Conjunto"}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {data.adSets.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Conjuntos Adicionados ({data.adSets.length})</h3>
          {data.adSets.map((adSet: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{adSet.unitName}</p>
                    <p className="text-sm text-gray-500">{adSet.websiteUrl}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {adSet.optimizationGoal === 3 ? "CPA" : "Lance"}: R${" "}
                      {(adSet.bid / 1000000).toFixed(2)} |
                      {adSet.dayBudget &&
                        ` Orçamento: R$ ${(adSet.dayBudget / 1000000).toFixed(2)}`}
                      {adSet.optimizationGoal === 3 && adSet.conversionId && (
                        <> | Conversão: {adSet.conversionId}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(index)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRemove(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data.adSets.length === 0 && (
        <p className="text-center text-gray-500 py-8">Adicione pelo menos um conjunto de anúncios</p>
      )}
    </div>
  );
}

