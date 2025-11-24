"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Plus,
  RefreshCw,
  Search,
  Pause,
  Play,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrencyBRL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdSetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [adSets, setAdSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  // Seleção
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Ordenação
  const [sortField, setSortField] = useState<string>("unitName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      setSelectedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const fetchCampaigns = async () => {
    const res = await fetch(`/api/kwai/campaigns?accountId=${selectedAccount}`);
    const data = await res.json();
    if (data.success && data.campaigns.length > 0) {
      setCampaigns(data.campaigns);
      setSelectedCampaign(data.campaigns[0].campaignId.toString());
    } else {
      setCampaigns([]);
      setSelectedCampaign("");
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedCampaign) {
      fetchAdSets();
      setSelectedIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign]);

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

  // Função de ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-300" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  // Ad Sets filtrados e ordenados
  const filteredAdSets = useMemo(() => {
    let result = adSets.filter((adSet) => {
      const matchesSearch =
        searchTerm === "" ||
        adSet.unitName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && adSet.openStatus === 1) ||
        (statusFilter === "paused" && adSet.openStatus === 2);

      return matchesSearch && matchesStatus;
    });

    // Ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }

      if (
        typeof aValue === "number" ||
        sortField === "bid" ||
        sortField === "dayBudget" ||
        sortField === "unitBudget"
      ) {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [adSets, searchTerm, statusFilter, sortField, sortDirection]);

  const toggleSelection = (unitId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(unitId)) {
      newSelected.delete(unitId);
    } else {
      newSelected.add(unitId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAdSets.length && filteredAdSets.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAdSets.map((a) => a.unitId)));
    }
  };

  const bulkUpdateStatus = async (newStatus: 1 | 2) => {
    if (selectedIds.size === 0) {
      toast({
        title: "Nenhum Ad Set selecionado",
        description: "Selecione pelo menos um Ad Set",
        variant: "destructive",
      });
      return;
    }

    const action = newStatus === 1 ? "ativar" : "pausar";
    if (!confirm(`Deseja ${action} ${selectedIds.size} Ad Set(s)?`)) {
      return;
    }

    setBulkLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const unitId of selectedIds) {
      try {
        const res = await fetch("/api/kwai/ad-sets/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: parseInt(selectedAccount),
            unitId,
            openStatus: newStatus,
          }),
        });

        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    toast({
      title: `${successCount} Ad Set(s) ${newStatus === 1 ? "ativado(s)" : "pausado(s)"}`,
      description: errorCount > 0 ? `${errorCount} erro(s)` : undefined,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    setSelectedIds(new Set());
    fetchAdSets();
    setBulkLoading(false);
  };

  const toggleAdSetStatus = async (unitId: number, currentStatus: number) => {
    try {
      // API do Kwai: 1 = Ativo, 2 = Pausado
      const newStatus = currentStatus === 1 ? 2 : 1;

      const res = await fetch("/api/kwai/ad-sets/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(selectedAccount),
          unitId,
          openStatus: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao atualizar status");
      }

      toast({
        title: newStatus === 1 ? "✅ Ad Set ativado!" : "⏸️ Ad Set pausado!",
      });
      fetchAdSets();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedIds(new Set());
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>Seus Ad Sets</CardTitle>
              <div className="flex items-center gap-2">
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

                <Button
                  onClick={fetchAdSets}
                  variant="outline"
                  size="icon"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* FILTROS */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || statusFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}

              <div className="text-sm text-gray-500">
                {filteredAdSets.length} de {adSets.length} ad sets
              </div>
            </div>

            {/* AÇÕES EM MASSA */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-800">
                  {selectedIds.size} selecionado(s)
                </span>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus(1)}
                  disabled={bulkLoading}
                  className="bg-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Ativar Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus(2)}
                  disabled={bulkLoading}
                  className="bg-white"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar Todos
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredAdSets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {adSets.length === 0
                ? "Nenhum Ad Set encontrado nesta campanha."
                : "Nenhum Ad Set corresponde aos filtros."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedIds.size === filteredAdSets.length && filteredAdSets.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("unitName")}
                  >
                    <div className="flex items-center">
                      Nome
                      <SortIcon field="unitName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("optimizeTarget")}
                  >
                    <div className="flex items-center">
                      Otimização
                      <SortIcon field="optimizeTarget" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("openStatus")}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="openStatus" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("bid")}
                  >
                    <div className="flex items-center">
                      Bid
                      <SortIcon field="bid" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("dayBudget")}
                  >
                    <div className="flex items-center">
                      Budget
                      <SortIcon field="dayBudget" />
                    </div>
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdSets.map((adSet) => (
                  <TableRow
                    key={adSet.unitId}
                    className={selectedIds.has(adSet.unitId) ? "bg-blue-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(adSet.unitId)}
                        onCheckedChange={() => toggleSelection(adSet.unitId)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{adSet.unitName}</TableCell>
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
                        className={
                          adSet.openStatus === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {adSet.openStatus === 1 ? "Ativo" : "Pausado"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrencyBRL(adSet.bid)}</TableCell>
                    <TableCell>
                      {adSet.unitBudget ? formatCurrencyBRL(adSet.unitBudget) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAdSetStatus(adSet.unitId, adSet.openStatus)}
                      >
                        {adSet.openStatus === 1 ? "Pausar" : "Ativar"}
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
