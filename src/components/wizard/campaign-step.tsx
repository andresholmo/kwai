"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reaisToMicro } from "@/lib/utils";

export function CampaignStep({ data, onUpdate }: any) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    accountId: data.campaign?.accountId || "",
    campaignName: data.campaign?.campaignName || "",
    marketingGoal: data.campaign?.marketingGoal || 3,
    objective: data.campaign?.objective || 2,
    campaignBudgetType: data.campaign?.campaignBudgetType || 1,
    campaignBudget: data.campaign?.campaignBudget
      ? (data.campaign.campaignBudget / 1000000).toString()
      : "",
  });

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/kwai/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0 && !formData.accountId) {
          handleChange("accountId", data.accounts[0].account_id.toString());
        }
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Atualizar wizard data
    onUpdate({
      ...data,
      campaign: {
        ...newData,
        campaignBudget: newData.campaignBudget
          ? reaisToMicro(parseFloat(newData.campaignBudget))
          : undefined,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Conta de Anúncios *</Label>
        <Select value={formData.accountId} onValueChange={(v) => handleChange("accountId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.account_id} value={account.account_id.toString()}>
                {account.account_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nome da Campanha *</Label>
        <Input
          value={formData.campaignName}
          onChange={(e) => handleChange("campaignName", e.target.value)}
          placeholder="Ex: Black Friday 2024"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Objetivo de Marketing *</Label>
          <Select
            value={formData.marketingGoal.toString()}
            onValueChange={(v) => handleChange("marketingGoal", parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Awareness (Reconhecimento)</SelectItem>
              <SelectItem value="2">Consideration (Consideração)</SelectItem>
              <SelectItem value="3">Conversion (Conversão)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Destino *</Label>
          <Select
            value={formData.objective.toString()}
            onValueChange={(v) => handleChange("objective", parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">App (Aplicativo)</SelectItem>
              <SelectItem value="2">Website (Site)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Orçamento</Label>
          <Select
            value={formData.campaignBudgetType.toString()}
            onValueChange={(v) => handleChange("campaignBudgetType", parseInt(v))}
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
          <Label>Valor do Orçamento (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="50"
            value={formData.campaignBudget}
            onChange={(e) => handleChange("campaignBudget", e.target.value)}
            placeholder="50,00"
          />
          <p className="text-xs text-gray-500">Mínimo: R$ 50,00</p>
        </div>
      </div>
    </div>
  );
}

