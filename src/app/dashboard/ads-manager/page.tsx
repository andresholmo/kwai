"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  RefreshCw,
  Search,
  Edit,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { StatusToggle } from "@/components/ads-manager/status-toggle";
import { StatusBadge } from "@/components/ads-manager/status-badge";
import { BulkActions } from "@/components/ads-manager/bulk-actions";
import { EditSheet } from "@/components/ads-manager/edit-sheet";
import { MetricsCell } from "@/components/ads-manager/metrics-cell";
import { formatCurrencyBRL } from "@/lib/utils";
import type { Campaign, AdSet, Ad, TabType } from "@/types/ads-manager";

export default function AdsManagerPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Estado principal
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dados
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [metrics, setMetrics] = useState<Record<number, any>>({});

  // Seleção
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "paused"
  >("all");

  // Edição
  const [editOpen, setEditOpen] = useState(false);
  const [editType, setEditType] = useState<"campaign" | "adset" | "ad">(
    "campaign"
  );
  const [editData, setEditData] = useState<any>(null);

  // Buscar contas
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Buscar dados quando conta mudar
  useEffect(() => {
    if (selectedAccount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, activeTab]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/kwai/accounts");
      const data = await res.json();
      if (data.success && data.accounts.length > 0) {
        setAccounts(data.accounts);
        setSelectedAccount(data.accounts[0].account_id.toString());
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const fetchData = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      if (activeTab === "campaigns") {
        await fetchCampaigns();
      } else if (activeTab === "adsets") {
        await fetchAdSets();
      } else {
        await fetchAds();
      }

      // Buscar métricas em paralelo
      fetchMetrics();
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    const res = await fetch(`/api/kwai/campaigns?accountId=${selectedAccount}`);
    const data = await res.json();
    if (data.success) {
      setCampaigns(data.campaigns || []);
    }
  };

  const fetchAdSets = async () => {
    const res = await fetch(
      `/api/kwai/all-adsets?accountId=${selectedAccount}`
    );
    const data = await res.json();
    if (data.success) {
      setAdSets(data.adSets || []);
    }
  };

  const fetchAds = async () => {
    const res = await fetch(
      `/api/kwai/all-creatives?accountId=${selectedAccount}`
    );
    const data = await res.json();
    if (data.success) {
      setAds(data.creatives || []);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(
        `/api/kwai/metrics?accountId=${selectedAccount}&level=${
          activeTab === "campaigns"
            ? "campaign"
            : activeTab === "adsets"
            ? "adset"
            : "ad"
        }`
      );
      const data = await res.json();
      if (data.success && data.metrics) {
        const metricsMap: Record<number, any> = {};
        data.metrics.forEach((m: any) => {
          const id = m.campaignId || m.unitId || m.creativeId;
          if (id) metricsMap[id] = m;
        });
        setMetrics(metricsMap);
      }
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({ title: "Dados atualizados!" });
  };

  // Toggle de status
  const handleStatusToggle = async (
    id: number,
    type: "campaign" | "adset" | "ad",
    newStatus: boolean
  ) => {
    const endpoint =
      type === "campaign"
        ? "/api/kwai/campaigns/status"
        : type === "adset"
        ? "/api/kwai/ad-sets/status"
        : "/api/kwai/creatives/status";

    const idKey =
      type === "campaign"
        ? "campaignId"
        : type === "adset"
        ? "unitId"
        : "creativeId";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: parseInt(selectedAccount),
        [idKey]: id,
        openStatus: newStatus ? 1 : 2,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    toast({ title: newStatus ? "Ativado!" : "Pausado!" });
    fetchData();
  };

  // Seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = getCurrentItems().map((item) => getItemId(item));
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Ações em massa
  const handleBulkActivate = async () => {
    for (const id of selectedIds) {
      await handleStatusToggle(
        id,
        activeTab === "campaigns"
          ? "campaign"
          : activeTab === "adsets"
          ? "adset"
          : "ad",
        true
      );
    }
    setSelectedIds(new Set());
    fetchData();
  };

  const handleBulkPause = async () => {
    for (const id of selectedIds) {
      await handleStatusToggle(
        id,
        activeTab === "campaigns"
          ? "campaign"
          : activeTab === "adsets"
          ? "adset"
          : "ad",
        false
      );
    }
    setSelectedIds(new Set());
    fetchData();
  };

  const handleBulkDuplicate = async () => {
    if (activeTab !== "campaigns") {
      toast({
        title: "Duplicação disponível apenas para campanhas",
        variant: "destructive",
      });
      return;
    }

    for (const id of selectedIds) {
      try {
        const res = await fetch("/api/kwai/campaigns/duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: parseInt(selectedAccount),
            campaignId: id,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } catch (error: any) {
        toast({
          title: `Erro ao duplicar: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    toast({ title: `${selectedIds.size} campanha(s) duplicada(s)!` });
    setSelectedIds(new Set());
    fetchData();
  };

  const handleBulkDelete = async () => {
    toast({
      title: "Exclusão em massa não disponível via API",
      variant: "destructive",
    });
  };

  // Edição
  const handleEdit = (item: any) => {
    setEditType(
      activeTab === "campaigns"
        ? "campaign"
        : activeTab === "adsets"
        ? "adset"
        : "ad"
    );
    setEditData(item);
    setEditOpen(true);
  };

  const handleSaveEdit = async (data: any) => {
    try {
      const endpoint =
        editType === "campaign"
          ? "/api/kwai/campaigns/edit"
          : editType === "adset"
          ? "/api/kwai/ad-sets/edit"
          : "/api/kwai/creatives/edit";

      const idKey =
        editType === "campaign"
          ? "campaignId"
          : editType === "adset"
          ? "unitId"
          : "creativeId";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(selectedAccount),
          [idKey]: data[idKey],
          updates: data,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast({ title: "Salvo com sucesso!" });
      fetchData();
    } catch (error: any) {
      toast({ title: `Erro: ${error.message}`, variant: "destructive" });
      throw error;
    }
  };

  // Duplicar individual
  const handleDuplicate = async (campaignId: number) => {
    try {
      const res = await fetch("/api/kwai/campaigns/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(selectedAccount),
          campaignId,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({ title: "Campanha duplicada!" });
      fetchData();
    } catch (error: any) {
      toast({ title: `Erro: ${error.message}`, variant: "destructive" });
    }
  };

  // Helpers
  const getCurrentItems = () => {
    switch (activeTab) {
      case "campaigns":
        return campaigns;
      case "adsets":
        return adSets;
      case "ads":
        return ads;
      default:
        return [];
    }
  };

  const getItemId = (item: any): number => {
    return item.campaignId || item.unitId || item.creativeId;
  };

  const getItemName = (item: any): string => {
    return item.campaignName || item.unitName || item.creativeName;
  };

  const getItemStatus = (item: any): "active" | "paused" => {
    return item.openStatus === 1 ? "active" : "paused";
  };

  // Filtrar itens
  const filteredItems = getCurrentItems().filter((item) => {
    const name = getItemName(item).toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.openStatus === 1) ||
      (statusFilter === "paused" && item.openStatus !== 1);
    return matchesSearch && matchesStatus;
  });

  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(getItemId(item)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciador de Anúncios</h1>
          <p className="text-gray-500">
            Gerencie suas campanhas, conjuntos e anúncios
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(
              `/dashboard/${
                activeTab === "campaigns"
                  ? "campaigns"
                  : activeTab === "adsets"
                  ? "ad-sets"
                  : "creatives"
              }/new`
            )
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar{" "}
          {activeTab === "campaigns"
            ? "Campanha"
            : activeTab === "adsets"
            ? "Conjunto"
            : "Anúncio"}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Conta */}
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[180px]">
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

            {/* Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v: any) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabType);
          setSelectedIds(new Set());
        }}
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="campaigns">
            Campanhas
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {campaigns.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="adsets">
            Conjuntos
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {adSets.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="ads">
            Anúncios
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {ads.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onActivate={handleBulkActivate}
        onPause={handleBulkPause}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Status</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Entrega</TableHead>
                {activeTab === "campaigns" && <TableHead>Orçamento</TableHead>}
                {activeTab === "adsets" && <TableHead>Bid</TableHead>}
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-12 text-gray-500"
                  >
                    {searchQuery
                      ? "Nenhum resultado encontrado"
                      : "Nenhum item para exibir"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const id = getItemId(item);
                  const itemMetrics = metrics[id] || {};

                  return (
                    <TableRow
                      key={id}
                      className={selectedIds.has(id) ? "bg-blue-50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <StatusToggle
                          isActive={item.openStatus === 1}
                          onToggle={(newStatus) =>
                            handleStatusToggle(
                              id,
                              activeTab === "campaigns"
                                ? "campaign"
                                : activeTab === "adsets"
                                ? "adset"
                                : "ad",
                              newStatus
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getItemName(item)}</div>
                          {activeTab === "campaigns" && (
                            <div className="text-xs text-gray-500">
                              ID: {id}
                            </div>
                          )}
                          {activeTab === "adsets" && item.campaignName && (
                            <div className="text-xs text-gray-500">
                              {item.campaignName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getItemStatus(item)} />
                      </TableCell>
                      {activeTab === "campaigns" && (
                        <TableCell>
                          <div>
                            <div>
                              {formatCurrencyBRL(
                                (item as Campaign).campaignBudget
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(item as Campaign).campaignBudgetType === 1
                                ? "Diário"
                                : "Vitalício"}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {activeTab === "adsets" && (
                        <TableCell>
                          <MetricsCell
                            value={(item as AdSet).bid}
                            type="currency"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <MetricsCell
                          value={itemMetrics.impression}
                          type="number"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricsCell value={itemMetrics.click} type="number" />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricsCell value={itemMetrics.ctr} type="percentage" />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricsCell value={itemMetrics.cost} type="currency" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {activeTab === "campaigns" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Mostrando {filteredItems.length} de {getCurrentItems().length}{" "}
          {activeTab === "campaigns"
            ? "campanhas"
            : activeTab === "adsets"
            ? "conjuntos"
            : "anúncios"}
        </span>
      </div>

      {/* Edit Sheet */}
      <EditSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        type={editType}
        data={editData}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

