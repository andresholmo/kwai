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

export default function AdSetsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [adSets, setAdSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/kwai/accounts");
    const data = await res.json();
    if (data.success) {
      setAccounts(data.accounts);
      if (data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0].account_id.toString());
      }
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const fetchCampaigns = async () => {
    const res = await fetch(`/api/kwai/campaigns?accountId=${selectedAccount}`);
    const data = await res.json();
    if (data.success) {
      setCampaigns(data.campaigns);
      if (data.campaigns.length > 0) {
        setSelectedCampaign(data.campaigns[0].campaignId.toString());
      }
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedCampaign) {
      fetchAdSets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, selectedCampaign]);

  const fetchAdSets = async () => {
    if (!selectedAccount || !selectedCampaign) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/kwai/ad-sets?accountId=${selectedAccount}&campaignId=${selectedCampaign}`
      );
      const data = await res.json();
      if (data.success) {
        setAdSets(data.adSets);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ad Sets</h1>
          <p className="text-gray-500">Gerencie seus grupos de anúncios</p>
        </div>
        <Button onClick={() => router.push("/dashboard/ad-sets/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ad Set
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Seus Ad Sets</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Conta" />
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

              <Select
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Campanha" />
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

              <Button
                onClick={fetchAdSets}
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
          ) : adSets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum Ad Set encontrado. Crie seu primeiro Ad Set!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Otimização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bid</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adSets.map((adSet) => (
                  <TableRow key={adSet.unitId}>
                    <TableCell className="font-medium">
                      {adSet.unitName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {adSet.optimizeTarget === 1
                          ? "Click"
                          : adSet.optimizeTarget === 2
                          ? "Impression"
                          : "Conversion"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={adSet.openStatus === 1 ? "default" : "secondary"}
                      >
                        {adSet.openStatus === 1 ? "Ativo" : "Pausado"}
                      </Badge>
                    </TableCell>
                    <TableCell>R$ {(adSet.bid / 100).toFixed(2)}</TableCell>
                    <TableCell>R$ {(adSet.unitBudget / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver Criativos
                      </Button>
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
