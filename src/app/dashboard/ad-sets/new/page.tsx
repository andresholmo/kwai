"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reaisToMicro } from "@/lib/utils";

export default function NewAdSetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Pegar parâmetros da URL
  const preAccountId = searchParams.get("accountId");
  const preCampaignId = searchParams.get("campaignId");
  const preCampaignName = searchParams.get("campaignName");

  const [formData, setFormData] = useState({
    accountId: preAccountId || "",
    campaignId: preCampaignId || "",
    unitName: "",
    websiteUrl: "",
    optimizeTarget: "3", // 1=Click, 2=Impression, 3=Conversion
    bidType: "10", // 1=CPC, 2=CPM, 10=oCPM
    bid: "",
    dayBudget: "",
    scheduleStartTime: "",
    scheduleEndTime: "",
    // Targeting
    gender: "3", // 1=Male, 2=Female, 3=All
  });

  // Mostrar mensagem se veio de criação de campanha
  useEffect(() => {
    if (preCampaignName) {
      toast({
        title: "📢 Próximo passo",
        description: `Configure o conjunto de anúncios para "${preCampaignName}"`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preCampaignName]);

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.accountId) {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.accountId]);

  const fetchAccounts = async () => {
    const res = await fetch("/api/kwai/accounts");
    const data = await res.json();
    if (data.success && data.accounts.length > 0) {
      setAccounts(data.accounts);
      if (!formData.accountId) {
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
      if (!formData.campaignId && data.campaigns.length > 0) {
        setFormData((prev) => ({
          ...prev,
          campaignId: data.campaigns[0].campaignId.toString(),
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unitName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do Ad Set é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (!formData.websiteUrl.trim()) {
      toast({
        title: "Erro",
        description: "URL de destino é obrigatória",
        variant: "destructive",
      });
      return;
    }
    if (!formData.bid) {
      toast({
        title: "Erro",
        description: "Valor do Bid é obrigatório",
        variant: "destructive",
      });
      return;
    }
    if (!formData.scheduleStartTime) {
      toast({
        title: "Erro",
        description: "Data de início é obrigatória",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Formatar data para o formato da API: "2024-01-01 00:00:00"
      const startDate = new Date(formData.scheduleStartTime);
      const formattedStartTime = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")} 00:00:00`;

      let formattedEndTime = undefined;
      if (formData.scheduleEndTime) {
        const endDate = new Date(formData.scheduleEndTime);
        formattedEndTime = `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")} 23:59:59`;
      }

      const res = await fetch("/api/kwai/ad-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(formData.accountId),
          adSetData: {
            campaignId: parseInt(formData.campaignId),
            unitName: formData.unitName.trim(),
            optimizeTarget: parseInt(formData.optimizeTarget),
            bidType: parseInt(formData.bidType),
            bid: reaisToMicro(parseFloat(formData.bid)),
            ...(formData.dayBudget && {
              unitBudget: reaisToMicro(parseFloat(formData.dayBudget)),
            }),
            scheduleStartTime: formattedStartTime,
            ...(formattedEndTime && { scheduleEndTime: formattedEndTime }),
            gender: parseInt(formData.gender) === 3 ? 0 : parseInt(formData.gender),
            // Brasil
            region: [76], // Código do Brasil
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        const unitId = data.adSet?.unitId || data.adSet?.[0]?.unitId;

        toast({
          title: "✅ Conjunto criado!",
          description: "Agora vamos adicionar os criativos (anúncios).",
        });

        // Redirecionar para criar Criativo
        if (unitId) {
          router.push(
            `/dashboard/creatives/new?accountId=${formData.accountId}&unitId=${unitId}&unitName=${encodeURIComponent(formData.unitName)}`
          );
        } else {
          router.push("/dashboard/ad-sets");
        }
      } else {
        throw new Error(data.error || "Erro ao criar Ad Set");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar Ad Set",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Data mínima: hoje
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Ad Set</h1>
          {preCampaignName && (
            <p className="text-sm text-gray-500 mt-1">
              Para a campanha: <span className="font-semibold">{preCampaignName}</span>
            </p>
          )}
          {!preCampaignName && <p className="text-gray-500">Crie um novo grupo de anúncios</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Vinculação</CardTitle>
              <CardDescription>Selecione a conta e campanha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Conta de Anúncios *</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, accountId: value, campaignId: "" })
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
                <Label>Campanha *</Label>
                <Select
                  value={formData.campaignId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaignId: value })
                  }
                  disabled={!!preCampaignId || !formData.accountId || campaigns.length === 0}
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
                {preCampaignName && (
                  <p className="text-xs text-blue-600">✓ Campanha pré-selecionada</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Ad Set</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unitName">Nome do Ad Set *</Label>
                <Input
                  id="unitName"
                  value={formData.unitName}
                  onChange={(e) =>
                    setFormData({ ...formData, unitName: e.target.value })
                  }
                  placeholder="Ex: Brasil - Conversão - CPC"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">URL de Destino *</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                  placeholder="https://seusite.com/pagina"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Otimização e Lances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Objetivo de Otimização *</Label>
                <Select
                  value={formData.optimizeTarget}
                  onValueChange={(value) =>
                    setFormData({ ...formData, optimizeTarget: value })
                  }
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
                <Label>Tipo de Lance *</Label>
                <Select
                  value={formData.bidType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bidType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">CPC (Custo por Clique)</SelectItem>
                    <SelectItem value="2">CPM (Custo por Mil Impressões)</SelectItem>
                    <SelectItem value="10">oCPM (CPM Otimizado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bid">Valor do Lance (R$) *</Label>
                <Input
                  id="bid"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.bid}
                  onChange={(e) =>
                    setFormData({ ...formData, bid: e.target.value })
                  }
                  placeholder="Ex: 0.10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayBudget">Orçamento Diário (R$)</Label>
                <Input
                  id="dayBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dayBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, dayBudget: e.target.value })
                  }
                  placeholder="Ex: 50.00 (opcional)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleStartTime">Data de Início *</Label>
                <Input
                  id="scheduleStartTime"
                  type="date"
                  min={today}
                  value={formData.scheduleStartTime}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduleStartTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleEndTime">Data de Término (Opcional)</Label>
                <Input
                  id="scheduleEndTime"
                  type="date"
                  min={formData.scheduleStartTime || today}
                  value={formData.scheduleEndTime}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduleEndTime: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  Deixe em branco para campanha sem data de término
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Targeting</CardTitle>
              <CardDescription>Segmentação de público</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Todos</SelectItem>
                    <SelectItem value="1">Masculino</SelectItem>
                    <SelectItem value="2">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                <strong>País:</strong> Brasil (fixo)
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Criando..." : "Criar Ad Set"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

