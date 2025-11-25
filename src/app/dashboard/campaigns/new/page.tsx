"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    accountId: "",
    campaignName: "",
    marketingGoal: "3", // 1=Awareness, 2=Consideration, 3=Conversion
    objective: "2", // 1=App, 2=Website
    campaignBudgetType: "1", // 1=Daily, 2=Lifetime
    campaignBudget: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/kwai/accounts");
      const data = await res.json();
      if (data.success && data.accounts.length > 0) {
        setAccounts(data.accounts);
        setFormData((prev) => ({
          ...prev,
          accountId: data.accounts[0].account_id.toString(),
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.campaignName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da campanha é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/kwai/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(formData.accountId),
          campaignData: {
            campaignName: formData.campaignName.trim(),
            marketingGoal: parseInt(formData.marketingGoal),
            objective: parseInt(formData.objective),
            // NÃO enviar adCategory aqui - será adicionado na API
            ...(formData.campaignBudgetType && {
              campaignBudgetType: parseInt(formData.campaignBudgetType),
            }),
            // Converter para micro-reais se tiver budget
            ...(formData.campaignBudget && {
              campaignBudget: reaisToMicro(parseFloat(formData.campaignBudget)),
            }),
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Pegar ID da campanha criada
        const campaignId = data.campaign?.campaignId || data.campaign?.[0]?.campaignId;

        toast({
          title: "✅ Campanha criada!",
          description: "Agora vamos criar o conjunto de anúncios.",
        });

        // Redirecionar para criar Ad Set com campanha pré-selecionada
        if (campaignId) {
          router.push(
            `/dashboard/ad-sets/new?accountId=${formData.accountId}&campaignId=${campaignId}&campaignName=${encodeURIComponent(formData.campaignName)}`
          );
        } else {
          router.push("/dashboard/campaigns");
        }
      } else {
        throw new Error(data.error || "Erro ao criar campanha");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar campanha",
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
          <h1 className="text-3xl font-bold">Nova Campanha</h1>
          <p className="text-gray-500">Crie uma nova campanha no Kwai</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure os dados principais da campanha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountId">Conta de Anúncios *</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, accountId: value })
                  }
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
                        {account.account_name} (ID: {account.account_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignName">Nome da Campanha *</Label>
                <Input
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) =>
                    setFormData({ ...formData, campaignName: e.target.value })
                  }
                  placeholder="Ex: Black Friday 2024 - Website"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  {formData.campaignName.length}/100 caracteres
                </p>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objetivo</CardTitle>
              <CardDescription>Defina o objetivo de marketing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Objetivo de Marketing *</Label>
                <Select
                  value={formData.marketingGoal}
                  onValueChange={(value) =>
                    setFormData({ ...formData, marketingGoal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">
                      Awareness (Reconhecimento de Marca)
                    </SelectItem>
                    <SelectItem value="2">Consideration (Consideração)</SelectItem>
                    <SelectItem value="3">Conversion (Conversão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Destino *</Label>
                <Select
                  value={formData.objective}
                  onValueChange={(value) =>
                    setFormData({ ...formData, objective: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aplicativo (App)</SelectItem>
                    <SelectItem value="2">Website (Site)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orçamento (Opcional)</CardTitle>
              <CardDescription>Defina o orçamento da campanha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Orçamento</Label>
                <Select
                  value={formData.campaignBudgetType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaignBudgetType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Orçamento Diário</SelectItem>
                    <SelectItem value="2">Orçamento Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignBudget">Valor do Orçamento (R$)</Label>
                <Input
                  id="campaignBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.campaignBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, campaignBudget: e.target.value })
                  }
                  placeholder="Ex: 100.00"
                />
                <p className="text-xs text-gray-500">
                  Deixe em branco para sem limite. Orçamento mínimo recomendado:
                  R$ 50,00
                </p>
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
              {loading ? "Criando..." : "Criar Campanha"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

