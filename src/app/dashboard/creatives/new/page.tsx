"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewCreativePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // Pegar parâmetros da URL
  const preAccountId = searchParams.get("accountId");
  const preUnitId = searchParams.get("unitId");
  const preUnitName = searchParams.get("unitName");

  const [formData, setFormData] = useState({
    accountId: preAccountId || "",
    campaignId: "",
    unitId: preUnitId || "",
    creativeName: "",
    description: "",
    actionUrl: "",
    actionType: "1", // 1=Learn More, 2=Download, 3=Shop Now, etc
    materialId: "",
  });

  // Mostrar mensagem se veio de criação de Ad Set
  useEffect(() => {
    if (preUnitName) {
      toast({
        title: "📢 Próximo passo",
        description: `Adicione os criativos para "${preUnitName}"`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preUnitName]);

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.accountId) {
      fetchCampaigns();
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountId]);

  useEffect(() => {
    if (formData.accountId && formData.campaignId) {
      fetchAdSets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.campaignId]);

  const fetchAccounts = async () => {
    const res = await fetch("/api/kwai/accounts");
    const data = await res.json();
    if (data.success) {
      setAccounts(data.accounts);
      if (!formData.accountId && data.accounts.length > 0) {
        setFormData((prev) => ({
          ...prev,
          accountId: data.accounts[0].account_id.toString(),
        }));
      }
    }
  };

  const fetchCampaigns = async () => {
    const res = await fetch(`/api/kwai/campaigns?accountId=${formData.accountId}`);
    const data = await res.json();
    if (data.success) {
      setCampaigns(data.campaigns);
      if (data.campaigns.length > 0) {
        setFormData((prev) => ({
          ...prev,
          campaignId: data.campaigns[0].campaignId.toString(),
        }));
      }
    }
  };

  const fetchAdSets = async () => {
    const res = await fetch(
      `/api/kwai/ad-sets?accountId=${formData.accountId}&campaignId=${formData.campaignId}`
    );
    const data = await res.json();
    if (data.success) {
      setAdSets(data.adSets);
      if (!formData.unitId && data.adSets.length > 0) {
        setFormData((prev) => ({
          ...prev,
          unitId: data.adSets[0].unitId.toString(),
        }));
      }
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/kwai/materials?accountId=${formData.accountId}`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.creativeName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do criativo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (!formData.actionUrl.trim()) {
      toast({
        title: "Erro",
        description: "URL de destino é obrigatória",
        variant: "destructive",
      });
      return;
    }
    if (!formData.materialId) {
      toast({
        title: "Erro",
        description: "Material é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/kwai/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(formData.accountId),
          creativeData: {
            unitId: parseInt(formData.unitId),
            creativeName: formData.creativeName.trim(),
            description: formData.description.trim() || undefined,
            actionUrl: formData.actionUrl.trim(),
            actionType: parseInt(formData.actionType),
            materialId: parseInt(formData.materialId),
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Criativo criado!",
          description: "Seu criativo foi criado e está em revisão.",
        });
        router.push("/dashboard/creatives");
      } else {
        throw new Error(data.error || "Erro ao criar criativo");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar criativo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Criativo</h1>
          {preUnitName && (
            <p className="text-sm text-gray-500 mt-1">
              Para o conjunto: <span className="font-semibold">{preUnitName}</span>
            </p>
          )}
          {!preUnitName && <p className="text-gray-500">Crie um novo anúncio criativo</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Vinculação</CardTitle>
              <CardDescription>Selecione onde o criativo será vinculado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Conta</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, accountId: value, campaignId: "", unitId: "" })
                  }
                  disabled={!!preAccountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem
                        key={account.account_id}
                        value={account.account_id.toString()}
                      >
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Campanha</Label>
                <Select
                  value={formData.campaignId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaignId: value, unitId: "" })
                  }
                  disabled={!formData.accountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem
                        key={campaign.campaignId}
                        value={campaign.campaignId.toString()}
                      >
                        {campaign.campaignName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ad Set *</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                  disabled={!!preUnitId || !formData.campaignId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ad set" />
                  </SelectTrigger>
                  <SelectContent>
                    {adSets.map((adSet) => (
                      <SelectItem key={adSet.unitId} value={adSet.unitId.toString()}>
                        {adSet.unitName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {preUnitName && (
                  <p className="text-xs text-blue-600">✓ Conjunto pré-selecionado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Criativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creativeName">Nome do Criativo *</Label>
                <Input
                  id="creativeName"
                  value={formData.creativeName}
                  onChange={(e) =>
                    setFormData({ ...formData, creativeName: e.target.value })
                  }
                  placeholder="Ex: Video Review Drama 01"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do anúncio (opcional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialId">Material (Vídeo/Imagem) *</Label>
                <Select
                  value={formData.materialId}
                  onValueChange={(value) => setFormData({ ...formData, materialId: value })}
                  disabled={!formData.accountId || materials.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.materialId} value={material.materialId.toString()}>
                        {material.materialName || `Material ${material.materialId}`} (
                        {material.materialType === 1 ? "Vídeo" : "Imagem"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {materials.length === 0 && formData.accountId
                    ? "Nenhum material encontrado. Faça upload de materiais primeiro."
                    : "Selecione um material já enviado para o Kwai"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call to Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actionUrl">URL de Destino *</Label>
                <Input
                  id="actionUrl"
                  type="url"
                  value={formData.actionUrl}
                  onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                  placeholder="https://seusite.com/pagina"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ação</Label>
                <Select
                  value={formData.actionType}
                  onValueChange={(value) => setFormData({ ...formData, actionType: value })}
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
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.unitId || !formData.materialId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Criando..." : "Criar Criativo"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

