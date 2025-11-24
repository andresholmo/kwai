"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrencyBRL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/kwai/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].account_id.toString());
        }
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/kwai/campaigns?accountId=${selectedAccount}`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const toggleCampaignStatus = async (campaignId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await fetch("/api/kwai/campaigns/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(selectedAccount),
          campaignId,
          openStatus: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: newStatus === 1 ? "Campanha ativada!" : "Campanha pausada!",
        });
        fetchCampaigns(); // Recarregar lista
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campanhas</h1>
          <p className="text-gray-500">Gerencie suas campanhas do Kwai</p>
        </div>
        <Button onClick={() => router.push("/dashboard/campaigns/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Suas Campanhas</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-[200px]">
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
              <Button
                onClick={fetchCampaigns}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma campanha encontrada. Crie sua primeira campanha!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium">
                      {campaign.campaignName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {campaign.objective === 1 ? "App" : "Website"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={campaign.openStatus === 1 ? "default" : "secondary"}
                      >
                        {campaign.openStatus === 1 ? "Ativa" : "Pausada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrencyBRL(campaign.campaignBudget)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleCampaignStatus(campaign.campaignId, campaign.openStatus)
                          }
                        >
                          {campaign.openStatus === 1 ? "Pausar" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
