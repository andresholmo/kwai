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

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  // Seleção
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Ordenação
  const [sortField, setSortField] = useState<string>("campaignName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
      setSelectedIds(new Set()); // Limpar seleção ao trocar conta
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

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

  // Campanhas filtradas e ordenadas
  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter((campaign) => {
      // Filtro por nome
      const matchesSearch =
        searchTerm === "" ||
        campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && campaign.openStatus === 1) ||
        (statusFilter === "paused" && campaign.openStatus === 2);

      return matchesSearch && matchesStatus;
    });

    // Ordenação
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Para strings
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }

      // Para números
      if (typeof aValue === "number" || sortField === "campaignBudget") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [campaigns, searchTerm, statusFilter, sortField, sortDirection]);

  // Toggle seleção individual
  const toggleSelection = (campaignId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedIds(newSelected);
  };

  // Selecionar/Deselecionar todos os filtrados
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCampaigns.length && filteredCampaigns.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCampaigns.map((c) => c.campaignId)));
    }
  };

  // Ação em massa
  const bulkUpdateStatus = async (newStatus: 1 | 2) => {
    if (selectedIds.size === 0) {
      toast({
        title: "Nenhuma campanha selecionada",
        description: "Selecione pelo menos uma campanha",
        variant: "destructive",
      });
      return;
    }

    const action = newStatus === 1 ? "ativar" : "pausar";
    if (!confirm(`Deseja ${action} ${selectedIds.size} campanha(s)?`)) {
      return;
    }

    setBulkLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const campaignId of selectedIds) {
      try {
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
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    toast({
      title: `${successCount} campanha(s) ${newStatus === 1 ? "ativada(s)" : "pausada(s)"}`,
      description: errorCount > 0 ? `${errorCount} erro(s)` : undefined,
      variant: errorCount > 0 ? "destructive" : "default",
    });

    setSelectedIds(new Set());
    fetchCampaigns();
    setBulkLoading(false);
  };

  // Toggle individual
  const toggleCampaignStatus = async (campaignId: number, currentStatus: number) => {
    try {
      // API do Kwai: 1 = Ativo, 2 = Pausado
      const newStatus = currentStatus === 1 ? 2 : 1;

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

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao atualizar status");
      }

      toast({
        title: newStatus === 1 ? "✅ Campanha ativada!" : "⏸️ Campanha pausada!",
      });
      fetchCampaigns();
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>Suas Campanhas</CardTitle>
              <div className="flex items-center gap-2">
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
                <Button
                  onClick={fetchCampaigns}
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
                {filteredCampaigns.length} de {campaigns.length} campanhas
              </div>
            </div>

            {/* AÇÕES EM MASSA */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-800">
                  {selectedIds.size} selecionada(s)
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
                  Ativar Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus(2)}
                  disabled={bulkLoading}
                  className="bg-white"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar Todas
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
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {campaigns.length === 0
                ? "Nenhuma campanha encontrada. Crie sua primeira campanha!"
                : "Nenhuma campanha corresponde aos filtros."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedIds.size === filteredCampaigns.length &&
                        filteredCampaigns.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("campaignName")}
                  >
                    <div className="flex items-center">
                      Nome
                      <SortIcon field="campaignName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("objective")}
                  >
                    <div className="flex items-center">
                      Objetivo
                      <SortIcon field="objective" />
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
                    onClick={() => handleSort("campaignBudget")}
                  >
                    <div className="flex items-center">
                      Budget
                      <SortIcon field="campaignBudget" />
                    </div>
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow
                    key={campaign.campaignId}
                    className={selectedIds.has(campaign.campaignId) ? "bg-blue-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(campaign.campaignId)}
                        onCheckedChange={() => toggleSelection(campaign.campaignId)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{campaign.campaignName}</TableCell>
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
                    <TableCell>{formatCurrencyBRL(campaign.campaignBudget)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleCampaignStatus(campaign.campaignId, campaign.openStatus)
                        }
                      >
                        {campaign.openStatus === 1 ? "Pausar" : "Ativar"}
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
