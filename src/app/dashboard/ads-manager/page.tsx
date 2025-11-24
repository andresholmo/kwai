"use client";

import { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
} from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dados
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);

  // Seleção hierárquica - IMPORTANTE: manter entre abas
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<any>(null);

  // Seleção para ações em massa
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

  // Buscar contas ao iniciar
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Buscar campanhas quando conta mudar
  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns();
      // Limpar seleções ao mudar de conta
      setSelectedCampaign(null);
      setSelectedAdSet(null);
      setAdSets([]);
      setAds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  // Buscar ad sets quando campanha for selecionada
  useEffect(() => {
    if (selectedCampaign) {
      fetchAdSets(selectedCampaign.campaignId);
      setSelectedAdSet(null);
      setAds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaign]);

  // Buscar anúncios quando ad set for selecionado
  useEffect(() => {
    if (selectedAdSet) {
      fetchAds(selectedAdSet.unitId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdSet]);

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
        const uniqueCampaigns = removeDuplicates(
          data.campaigns || [],
          "campaignId"
        );
        setCampaigns(uniqueCampaigns);
      }
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSets = async (campaignId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/kwai/ad-sets?accountId=${selectedAccount}&campaignId=${campaignId}`
      );
      const data = await res.json();
      if (data.success) {
        const uniqueAdSets = removeDuplicates(data.adSets || [], "unitId");
        setAdSets(uniqueAdSets);
      }
    } catch (error) {
      console.error("Erro ao buscar ad sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async (unitId: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/kwai/creatives?accountId=${selectedAccount}&unitId=${unitId}`
      );
      const data = await res.json();
      if (data.success) {
        const uniqueAds = removeDuplicates(data.creatives || [], "creativeId");
        setAds(uniqueAds);
      }
    } catch (error) {
      console.error("Erro ao buscar anúncios:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeDuplicates = (array: any[], key: string) => {
    const seen = new Set();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "campaigns") {
      await fetchCampaigns();
    } else if (activeTab === "adsets" && selectedCampaign) {
      await fetchAdSets(selectedCampaign.campaignId);
    } else if (activeTab === "ads" && selectedAdSet) {
      await fetchAds(selectedAdSet.unitId);
    }
    setRefreshing(false);
    toast({ title: "Dados atualizados!" });
  };

  // Selecionar campanha e ir para ad sets
  const handleSelectCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setActiveTab("adsets");
    setSelectedIds(new Set());
  };

  // Selecionar ad set e ir para anúncios
  const handleSelectAdSet = (adSet: any) => {
    setSelectedAdSet(adSet);
    setActiveTab("ads");
    setSelectedIds(new Set());
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
      if (!data.success) throw new Error(data.error);

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

  // Seleção para ações em massa
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredItems.map((item) => getItemId(item));
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
  const handleEdit = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
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
      handleRefresh();
    } catch (error: any) {
      toast({ title: `Erro: ${error.message}`, variant: "destructive" });
      throw error;
    }
  };

  const handleDuplicate = async (campaignId: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
  const getItemId = (item: any): number =>
    item.campaignId || item.unitId || item.creativeId;

  const getItemName = (item: any): string =>
    item.campaignName || item.unitName || item.creativeName || "Sem nome";

  const getItemStatus = (item: any): "active" | "paused" =>
    item.openStatus === 1 ? "active" : "paused";

  // Filtrar itens
  const filteredItems = useMemo(() => {
    const items =
      activeTab === "campaigns"
        ? campaigns
        : activeTab === "adsets"
        ? adSets
        : ads;

    return items.filter((item) => {
      const name = getItemName(item).toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.openStatus === 1) ||
        (statusFilter === "paused" && item.openStatus !== 1);
      return matchesSearch && matchesStatus;
    });
  }, [activeTab, campaigns, adSets, ads, searchQuery, statusFilter]);

  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(getItemId(item)));

  // Mudar de aba
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setSelectedIds(new Set());
    setSearchQuery("");
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <button
          onClick={() => {
            setActiveTab("campaigns");
            setSelectedCampaign(null);
            setSelectedAdSet(null);
          }}
          className={`hover:text-blue-600 ${
            !selectedCampaign ? "font-semibold text-gray-900" : ""
          }`}
        >
          Campanhas
        </button>

        {selectedCampaign && (
          <>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => {
                setActiveTab("adsets");
                setSelectedAdSet(null);
              }}
              className={`hover:text-blue-600 ${
                activeTab === "adsets" && !selectedAdSet
                  ? "font-semibold text-gray-900"
                  : ""
              }`}
            >
              {selectedCampaign.campaignName}
            </button>
          </>
        )}

        {selectedAdSet && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-gray-900">
              {selectedAdSet.unitName}
            </span>
          </>
        )}
      </div>
    );
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
          Criar
        </Button>
      </div>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
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

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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
            Campanhas ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="adsets" disabled={!selectedCampaign}>
            Conjuntos ({adSets.length})
          </TabsTrigger>
          <TabsTrigger value="ads" disabled={!selectedAdSet}>
            Anúncios ({ads.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Mensagem de contexto */}
      {activeTab === "adsets" && !selectedCampaign && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Selecione uma campanha na lista abaixo para ver seus conjuntos de
          anúncios.
        </div>
      )}

      {activeTab === "ads" && !selectedAdSet && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Selecione um conjunto de anúncios para ver os anúncios.
        </div>
      )}

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
                <TableHead className="w-32">Ações</TableHead>
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
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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

                  return (
                    <TableRow
                      key={id}
                      className={`${
                        selectedIds.has(id) ? "bg-blue-50" : ""
                      } ${
                        activeTab !== "ads" ? "cursor-pointer hover:bg-gray-50" : ""
                      }`}
                      onClick={() => {
                        if (activeTab === "campaigns")
                          handleSelectCampaign(item);
                        else if (activeTab === "adsets")
                          handleSelectAdSet(item);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {getItemName(item)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {id}
                            </div>
                          </div>
                          {activeTab !== "ads" && (
                            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
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
                        <TableCell>{formatCurrencyBRL(item.bid)}</TableCell>
                      )}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleEdit(item, e)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {activeTab === "campaigns" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDuplicate(id, e)}
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
      <div className="text-sm text-gray-500">
        Mostrando {filteredItems.length}{" "}
        {activeTab === "campaigns"
          ? "campanha(s)"
          : activeTab === "adsets"
          ? "conjunto(s)"
          : "anúncio(s)"}
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
