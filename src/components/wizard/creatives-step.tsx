"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Video, Image } from "lucide-react";

export function CreativesStep({ data, onUpdate }: any) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    adSetIndex: 0,
    creativeName: "",
    description: "",
    actionUrl: "",
    actionType: 1,
    materialId: "",
  });

  useEffect(() => {
    if (data.campaign?.accountId) {
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.campaign?.accountId]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/kwai/materials?accountId=${data.campaign.accountId}`);
      const dataRes = await res.json();
      if (dataRes.success) {
        setMaterials(dataRes.materials || []);
      }
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const handleAdd = () => {
    if (!formData.creativeName || !formData.actionUrl) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const newCreative = {
      ...formData,
      materialId: formData.materialId ? parseInt(formData.materialId) : undefined,
    };

    if (editingIndex !== null) {
      const updated = [...data.creatives];
      updated[editingIndex] = newCreative;
      onUpdate({ ...data, creatives: updated });
      setEditingIndex(null);
    } else {
      onUpdate({ ...data, creatives: [...data.creatives, newCreative] });
    }

    // Reset form
    setFormData({
      adSetIndex: 0,
      creativeName: "",
      description: "",
      actionUrl: "",
      actionType: 1,
      materialId: "",
    });
  };

  const handleEdit = (index: number) => {
    const creative = data.creatives[index];
    setFormData({
      ...creative,
      materialId: creative.materialId?.toString() || "",
    });
    setEditingIndex(index);
  };

  const handleRemove = (index: number) => {
    onUpdate({
      ...data,
      creatives: data.creatives.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Conjunto de Anúncios *</Label>
            <Select
              value={formData.adSetIndex.toString()}
              onValueChange={(v) => setFormData({ ...formData, adSetIndex: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.adSets.map((adSet: any, index: number) => (
                  <SelectItem key={index} value={index.toString()}>
                    {adSet.unitName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome do Criativo *</Label>
            <Input
              value={formData.creativeName}
              onChange={(e) => setFormData({ ...formData, creativeName: e.target.value })}
              placeholder="Ex: Anúncio Principal"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do anúncio (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>URL de Destino *</Label>
            <Input
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select
                value={formData.actionType.toString()}
                onValueChange={(v) => setFormData({ ...formData, actionType: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Saiba Mais</SelectItem>
                  <SelectItem value="2">Download</SelectItem>
                  <SelectItem value="3">Comprar Agora</SelectItem>
                  <SelectItem value="4">Inscreva-se</SelectItem>
                  <SelectItem value="5">Assistir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Material (Opcional)</Label>
              {materials.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                  {materials.map((material) => {
                    const isSelected = formData.materialId === material.materialId?.toString();
                    return (
                      <div
                        key={material.materialId}
                        className={`
                          border-2 rounded p-2 cursor-pointer transition-colors
                          ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}
                        `}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            materialId: isSelected ? "" : material.materialId?.toString() || "",
                          })
                        }
                      >
                        {material.materialType === 1 || material.materialType === "video" ? (
                          <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                            {material.url || material.coverUrl ? (
                              <img
                                src={material.url || material.coverUrl}
                                alt={material.materialName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Image className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        )}
                        <p className="text-xs mt-1 truncate">
                          {material.materialName || `Material ${material.materialId}`}
                        </p>
                        {isSelected && (
                          <p className="text-xs text-blue-600 font-medium">Selecionado</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border rounded p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Nenhum material encontrado na biblioteca
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Faça upload de materiais na página de Materiais primeiro
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handleAdd} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {editingIndex !== null ? "Atualizar Criativo" : "Adicionar Criativo"}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {data.creatives.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Criativos Adicionados ({data.creatives.length})</h3>
          {data.creatives.map((creative: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{creative.creativeName}</p>
                    <p className="text-sm text-gray-500">
                      Conjunto: {data.adSets[creative.adSetIndex]?.unitName || "N/A"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{creative.actionUrl}</p>
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

      {data.creatives.length === 0 && (
        <p className="text-center text-gray-500 py-8">Adicione pelo menos um criativo</p>
      )}
    </div>
  );
}

