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
import { Plus, Trash2, Upload, Video, Image, Loader2 } from "lucide-react";

export function CreativesStep({ data, onUpdate }: any) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    adSetIndex: 0,
    creativeName: "",
    description: "",
    actionUrl: "",
    actionType: 1,
    photoId: undefined as number | undefined,
  });

  const accountId = data.campaign?.accountId;

  const fetchMaterials = async () => {
    if (!accountId) return;

    setLoadingMaterials(true);
    try {
      const res = await fetch(
        `/api/kwai/materials-from-creatives?accountId=${accountId}`
      );
      const dataRes = await res.json();

      if (dataRes.success) {
        setMaterials(dataRes.materials || []);
      }
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const handleAdd = () => {
    if (!formData.creativeName || !formData.actionUrl) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const newCreative = {
      ...formData,
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
      photoId: undefined,
    });
  };

  const handleEdit = (index: number) => {
    const creative = data.creatives[index];
    setFormData({
      ...creative,
      photoId: creative.photoId,
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

            {/* Material - Biblioteca extraída dos criativos */}
            <div className="space-y-2">
              <Label>Material (Vídeo/Imagem)</Label>

              {loadingMaterials ? (
                <div className="p-4 border rounded-lg text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando biblioteca...</p>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-2">
                  <Select
                    value={formData.photoId?.toString() || undefined}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        photoId: val ? parseInt(val) : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material da biblioteca" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem
                          key={material.photoId}
                          value={material.photoId.toString()}
                        >
                          <div className="flex items-center gap-2">
                            {material.materialType === 1 ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <Image className="h-4 w-4" />
                            )}
                            <span>{material.name}</span>
                            <span className="text-xs text-muted-foreground">
                              (usado {material.usedInCreatives}x)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {materials.length} materiais encontrados na sua biblioteca
                  </p>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 text-center">
                  <Upload className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Nenhum material encontrado na biblioteca
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Faça upload de materiais no Kwai Ads Manager primeiro
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

