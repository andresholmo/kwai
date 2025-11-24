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
import { Plus, RefreshCw, ExternalLink, Play, Image } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function CreativesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedAdSet, setSelectedAdSet] = useState<string>("");
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/kwai/accounts");
    const data = await res.json();
    if (data.success && data.accounts.length > 0) {
      setAccounts(data.accounts);
      setSelectedAccount(data.accounts[0].account_id.toString());
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
      setCampaigns([]);
      setAdSets([]);
      setCreatives([]);
      setSelectedCampaign("");
      setSelectedAdSet("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const fetchCampaigns = async () => {
    const res = await fetch(`/api/kwai/campaigns?accountId=${selectedAccount}`);
    const data = await res.json();
    if (data.success && data.campaigns.length > 0) {
      setCampaigns(data.campaigns);
      setSelectedCampaign(data.campaigns[0].campaignId.toString());
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedCampaign) {
      fetchAdSets();
      setAdSets([]);
      setCreatives([]);
      setSelectedAdSet("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign]);

  const fetchAdSets = async () => {
    const res = await fetch(
      `/api/kwai/ad-sets?accountId=${selectedAccount}&campaignId=${selectedCampaign}`
    );
    const data = await res.json();
    if (data.success && data.adSets.length > 0) {
      setAdSets(data.adSets);
      setSelectedAdSet(data.adSets[0].unitId.toString());
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedAdSet) {
      fetchCreatives();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdSet]);

  const fetchCreatives = async () => {
    if (!selectedAccount || !selectedAdSet) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/kwai/creatives?accountId=${selectedAccount}&unitId=${selectedAdSet}`
      );
      const data = await res.json();
      if (data.success) {
        setCreatives(data.creatives);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao carregar criativos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800">Em Revisão</Badge>;
      case 3:
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 0:
        return <Badge variant="secondary">Pausado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Criativos</h1>
          <p className="text-gray-500">Gerencie seus anúncios criativos</p>
        </div>
        <Button
          onClick={() =>
            router.push(
              `/dashboard/creatives/new?accountId=${selectedAccount}&unitId=${selectedAdSet}`
            )
          }
          disabled={!selectedAdSet}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Criativo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Seus Criativos</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-[130px]">
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
                disabled={!campaigns.length}
              >
                <SelectTrigger className="w-[180px]">
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

              <Select
                value={selectedAdSet}
                onValueChange={setSelectedAdSet}
                disabled={!adSets.length}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ad Set" />
                </SelectTrigger>
                <SelectContent>
                  {adSets.map((adSet) => (
                    <SelectItem key={adSet.unitId} value={adSet.unitId.toString()}>
                      {adSet.unitName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={fetchCreatives}
                variant="outline"
                size="icon"
                disabled={loading || !selectedAdSet}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAdSet ? (
            <div className="text-center py-8 text-gray-500">
              Selecione uma conta, campanha e ad set para ver os criativos
            </div>
          ) : loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : creatives.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum criativo encontrado neste Ad Set.</p>
              <Button
                className="mt-4"
                onClick={() =>
                  router.push(
                    `/dashboard/creatives/new?accountId=${selectedAccount}&unitId=${selectedAdSet}`
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Criativo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL Destino</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatives.map((creative) => (
                  <TableRow key={creative.creativeId}>
                    <TableCell>
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        {creative.materialType === 1 ? (
                          <Play className="h-6 w-6 text-gray-400" />
                        ) : (
                          <Image className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {creative.creativeName || `Criativo ${creative.creativeId}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {creative.materialType === 1 ? "Vídeo" : "Imagem"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(creative.status || creative.openStatus)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {creative.actionUrl && (
                        <a
                          href={creative.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {creative.actionUrl.substring(0, 30)}...
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
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
