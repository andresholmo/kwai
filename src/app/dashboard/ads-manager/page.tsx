"use client";

import { useState, useEffect } from "react";
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
import { Plus, RefreshCw, Search, Edit, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { StatusToggle } from "@/components/ads-manager/status-toggle";
import { StatusBadge } from "@/components/ads-manager/status-badge";
import { BulkActions } from "@/components/ads-manager/bulk-actions";
import { EditSheet } from "@/components/ads-manager/edit-sheet";
import { formatCurrencyBRL } from "@/lib/utils";

type TabType = "campaigns" | "adsets" | "ads";

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
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);

  // Para filtrar ad sets e anúncios
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>("");

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

  // Buscar campanhas quando conta mudar
  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  // Buscar ad sets quando campanha for selecionada
  useEffect(() => {
    if (activeTab === "adsets" && selectedAccount && selectedCampaignId) {
      fetchAdSets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedAccount, selectedCampaignId]);

  // Buscar anúncios quando ad set for selecionado
  useEffect(() => {
    if (activeTab === "ads" && selectedAccount && selectedAdSetId) {
      fetchAds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedAccount, selectedAdSetId]);

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

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kwai/campaigns?accountId=${selectedAccount}`);
      const data = await res.json();
      if (data.success) {
        // Remover duplicatas por campaignId
        const uniqueCampaigns = removeDuplicates(
          data.campaigns || [],
          "campaignId"
        );
        setCampaigns(uniqueCampaigns);

        // Selecionar primeira campanha para ad sets
        if (uniqueCampaigns.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(uniqueCampaigns[0].campaignId.toString());
        }
      }
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSets = async () => {
    if (!selectedCampaignId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/kwai/ad-sets?accountId=${selectedAccount}&campaignId=${selectedCampaignId}`
      );
      const data = await res.json();
      if (data.success) {
        // Remover duplicatas por unitId
        const uniqueAdSets = removeDuplicates(data.adSets || [], "unitId");
        setAdSets(uniqueAdSets);

        // Selecionar primeiro ad set para anúncios
        if (uniqueAdSets.length > 0 && !selectedAdSetId) {
          setSelectedAdSetId(uniqueAdSets[0].unitId.toString());
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ad sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    if (!selectedAdSetId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/kwai/creatives?accountId=${selectedAccount}&unitId=${selectedAdSetId}`
      );
      const data = await res.json();
      if (data.success) {
        // Remover duplicatas por creativeId
        const uniqueAds = removeDuplicates(data.creatives || [], "creativeId");
        setAds(uniqueAds);
      }
    } catch (error) {
      console.error("Erro ao buscar anúncios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para remover duplicatas
  const removeDuplicates = (array: any[], key: string) => {
    const seen = new Set();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "campaigns") {
      await fetchCampaigns();
    } else if (activeTab === "adsets") {
      await fetchAdSets();
    } else {
      await fetchAds();
    }
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
      type === "campaign" ? "campaignId" : type === "adset" ? "unitId" : "creativeId";

    try {
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

      // Atualizar lista local
      if (type === "campaign") {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.campaignId === id ? { ...c, openStatus: newStatus ? 1 : 2 } : c
          )
        );
      } else if (type === "adset") {
        setAdSets((prev) =>
          prev.map((a) =>
            a.unitId === id ? { ...a, openStatus: newStatus ? 1 : 2 } : a
          )
        );
      } else {
        setAds((prev) =>
          prev.map((a) =>
            a.creativeId === id ? { ...a, openStatus: newStatus ? 1 : 2 } : a
          )
        );
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
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
    const type =
      activeTab === "campaigns"
        ? "campaign"
        : activeTab === "adsets"
        ? "adset"
        : "ad";

    for (const id of selectedIds) {
      try {
        await handleStatusToggle(id, type, true);
      } catch (e) {
        // Ignorar erros individuais
      }
    }
    setSelectedIds(new Set());
  };

  const handleBulkPause = async () => {
    const type =
      activeTab === "campaigns"
        ? "campaign"
        : activeTab === "adsets"
        ? "adset"
        : "ad";

    for (const id of selectedIds) {
      try {
        await handleStatusToggle(id, type, false);
      } catch (e) {
        // Ignorar erros individuais
      }
    }
    setSelectedIds(new Set());
  };

  const handleBulkDuplicate = async () => {
    if (activeTab !== "campaigns") {
      toast({
        title: "Duplicação disponível apenas para campanhas",
        variant: "destructive",
      });
      return;
    }

    let successCount = 0;
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
        if (data.success) successCount++;
      } catch (error) {
        // Ignorar erros individuais
      }
    }

    toast({ title: `${successCount} campanha(s) duplicada(s)!` });
    setSelectedIds(new Set());
    fetchCampaigns();
  };

  const handleBulkDelete = async () => {
    toast({
      title: "Exclusão não disponível via API",
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

      // Refresh
      if (editType === "campaign") fetchCampaigns();
      else if (editType === "adset") fetchAdSets();
      else fetchAds();
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
      fetchCampaigns();
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
    return item.campaignName || item.unitName || item.creativeName || "Sem nome";
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

  // Mudar de aba
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setSelectedIds(new Set());
    setSearchQuery("");

    if (tab === "adsets" && campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].campaignId.toString());
    }
  };

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
          <div className="flex items-center gap-4 flex-wrap">
            {/* Conta */}
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

            {/* Filtro de campanha para ad sets */}
            {activeTab === "adsets" && (
              <Select
                value={selectedCampaignId}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger className="w-[250px]">
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
            )}

            {/* Filtro de ad set para anúncios */}
            {activeTab === "ads" && (
              <Select
                value={selectedAdSetId}
                onValueChange={setSelectedAdSetId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecione o conjunto" />
                </SelectTrigger>
                <SelectContent>
                  {adSets.map((adSet) => (
                    <SelectItem
                      key={adSet.unitId}
                      value={adSet.unitId.toString()}
                    >
                      {adSet.unitName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome..."
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
              <SelectTrigger className="w-[120px]">
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
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
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
                {activeTab === "adsets" && <TableHead>Orçamento Diário</TableHead>}
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
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
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-gray-500"
                  >
                    {activeTab === "adsets" && !selectedCampaignId
                      ? "Selecione uma campanha para ver os conjuntos"
                      : activeTab === "ads" && !selectedAdSetId
                      ? "Selecione um conjunto para ver os anúncios"
                      : searchQuery
                      ? "Nenhum resultado encontrado"
                      : "Nenhum item para exibir"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const id = getItemId(item);

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
                          <div className="text-xs text-gray-500">ID: {id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getItemStatus(item)} />
                      </TableCell>
                      {activeTab === "campaigns" && (
                        <TableCell>
                          <div>
                            <div>
                              {formatCurrencyBRL(item.campaignBudget)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.campaignBudgetType === 1
                                ? "Diário"
                                : "Vitalício"}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {activeTab === "adsets" && (
                        <>
                          <TableCell>
                            {formatCurrencyBRL(item.bid)}
                          </TableCell>
                          <TableCell>
                            {item.dayBudget
                              ? formatCurrencyBRL(item.dayBudget)
                              : "Sem limite"}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {activeTab === "campaigns" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(id)}
                              title="Duplicar"
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
          Mostrando {filteredItems.length}{" "}
          {activeTab === "campaigns"
            ? "campanha(s)"
            : activeTab === "adsets"
            ? "conjunto(s)"
            : "anúncio(s)"}
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
