"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { StatusToggle } from "@/components/ads-manager/status-toggle";
import { StatusBadge } from "@/components/ads-manager/status-badge";
import { BulkActions } from "@/components/ads-manager/bulk-actions";
import { EditSheet } from "@/components/ads-manager/edit-sheet";
import { formatCurrencyBRL } from "@/lib/utils";

type ViewLevel = "campaigns" | "adsets" | "ads";

export default function AdsManagerPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Nível de visualização atual
  const [viewLevel, setViewLevel] = useState<ViewLevel>("campaigns");

  // Contas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  // Loading
  const [loading, setLoading] = useState(false);

  // Dados SEPARADOS para cada nível
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);

  // Seleção hierárquica
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
      resetToRootLevel();
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const resetToRootLevel = () => {
    setViewLevel("campaigns");
    setSelectedCampaign(null);
    setSelectedAdSet(null);
    setAdSets([]);
    setAds([]);
    setSelectedIds(new Set());
  };

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
      const res = await fetch(
        `/api/kwai/campaigns?accountId=${selectedAccount}`
      );
      const data = await res.json();
      if (data.success) {
        setCampaigns(removeDuplicates(data.campaigns || [], "campaignId"));
      }
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
      setCampaigns([]);
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
        setAdSets(removeDuplicates(data.adSets || [], "unitId"));
      }
    } catch (error) {
      console.error("Erro ao buscar ad sets:", error);
      setAdSets([]);
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
        setAds(removeDuplicates(data.creatives || [], "creativeId"));
      }
    } catch (error) {
      console.error("Erro ao buscar anúncios:", error);
      setAds([]);
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

  // Navegação hierárquica
  const navigateToCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setSelectedAdSet(null);
    setAds([]);
    setViewLevel("adsets");
    setSelectedIds(new Set());
    setSearchQuery("");
    fetchAdSets(campaign.campaignId);
  };

  const navigateToAdSet = (adSet: any) => {
    setSelectedAdSet(adSet);
    setViewLevel("ads");
    setSelectedIds(new Set());
    setSearchQuery("");
    fetchAds(adSet.unitId);
  };

  const navigateBack = () => {
    if (viewLevel === "ads") {
      setViewLevel("adsets");
      setSelectedAdSet(null);
      setAds([]);
    } else if (viewLevel === "adsets") {
      setViewLevel("campaigns");
      setSelectedCampaign(null);
      setAdSets([]);
    }
    setSelectedIds(new Set());
    setSearchQuery("");
  };

  const handleRefresh = async () => {
    if (viewLevel === "campaigns") {
      await fetchCampaigns();
    } else if (viewLevel === "adsets" && selectedCampaign) {
      await fetchAdSets(selectedCampaign.campaignId);
    } else if (viewLevel === "ads" && selectedAdSet) {
      await fetchAds(selectedAdSet.unitId);
    }
    toast({ title: "Atualizado!" });
  };

  // Toggle de status
  const handleStatusToggle = async (id: number, newStatus: boolean) => {
    const endpoint =
      viewLevel === "campaigns"
        ? "/api/kwai/campaigns/status"
        : viewLevel === "adsets"
        ? "/api/kwai/ad-sets/status"
        : "/api/kwai/creatives/status";

    const idKey =
      viewLevel === "campaigns"
        ? "campaignId"
        : viewLevel === "adsets"
        ? "unitId"
        : "creativeId";

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
      const updateList = (list: any[], idField: string) =>
        list.map((item) =>
          item[idField] === id
            ? { ...item, openStatus: newStatus ? 1 : 2 }
            : item
        );

      if (viewLevel === "campaigns") {
        setCampaigns((prev) => updateList(prev, "campaignId"));
      } else if (viewLevel === "adsets") {
        setAdSets((prev) => updateList(prev, "unitId"));
      } else {
        setAds((prev) => updateList(prev, "creativeId"));
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((item) => getItemId(item))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  // Ações em massa
  const handleBulkActivate = async () => {
    for (const id of selectedIds) {
      await handleStatusToggle(id, true);
    }
    setSelectedIds(new Set());
  };

  const handleBulkPause = async () => {
    for (const id of selectedIds) {
      await handleStatusToggle(id, false);
    }
    setSelectedIds(new Set());
  };

  const handleBulkDuplicate = async () => {
    if (viewLevel !== "campaigns") {
      toast({
        title: "Duplicação disponível apenas para campanhas",
        variant: "destructive",
      });
      return;
    }

    let count = 0;
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
        if ((await res.json()).success) count++;
      } catch {
        // Ignorar erros individuais
      }
    }
    toast({ title: `${count} campanha(s) duplicada(s)!` });
    setSelectedIds(new Set());
    fetchCampaigns();
  };

  const handleBulkDelete = () => {
    toast({ title: "Exclusão não disponível", variant: "destructive" });
  };

  // Edição
  const handleEdit = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditType(
      viewLevel === "campaigns"
        ? "campaign"
        : viewLevel === "adsets"
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

      toast({ title: "Salvo!" });
      handleRefresh();
    } catch (error: any) {
      toast({ title: `Erro: ${error.message}`, variant: "destructive" });
      throw error;
    }
  };

  const handleDuplicate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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
      toast({ title: "Campanha duplicada!" });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: `Erro: ${error.message}`, variant: "destructive" });
    }
  };

  // Dados baseados no nível atual
  const getCurrentData = (): any[] => {
    switch (viewLevel) {
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
    if (viewLevel === "campaigns") return item.campaignId;
    if (viewLevel === "adsets") return item.unitId;
    return item.creativeId;
  };

  const getItemName = (item: any): string => {
    if (viewLevel === "campaigns") return item.campaignName || "Sem nome";
    if (viewLevel === "adsets") return item.unitName || "Sem nome";
    return item.creativeName || "Sem nome";
  };

  // Filtrar
  const filteredItems = getCurrentData().filter((item) => {
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

  // Título baseado no nível
  const getTitle = () => {
    if (viewLevel === "campaigns") return "Campanhas";
    if (viewLevel === "adsets")
      return `Conjuntos de "${selectedCampaign?.campaignName}"`;
    return `Anúncios de "${selectedAdSet?.unitName}"`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {viewLevel !== "campaigns" && (
            <Button variant="ghost" size="icon" onClick={navigateBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{getTitle()}</h1>
            <p className="text-sm text-gray-500">
              {viewLevel === "campaigns" && `${campaigns.length} campanhas`}
              {viewLevel === "adsets" && `${adSets.length} conjuntos`}
              {viewLevel === "ads" && `${ads.length} anúncios`}
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            router.push(
              `/dashboard/${
                viewLevel === "campaigns"
                  ? "campaigns"
                  : viewLevel === "adsets"
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
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={resetToRootLevel}
          className={`hover:text-blue-600 ${
            viewLevel === "campaigns" ? "font-semibold" : "text-gray-500"
          }`}
        >
          Campanhas
        </button>

        {selectedCampaign && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => {
                setViewLevel("adsets");
                setSelectedAdSet(null);
                setAds([]);
              }}
              className={`hover:text-blue-600 ${
                viewLevel === "adsets" ? "font-semibold" : "text-gray-500"
              }`}
            >
              {selectedCampaign.campaignName}
            </button>
          </>
        )}

        {selectedAdSet && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-semibold">{selectedAdSet.unitName}</span>
          </>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Select
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem
                    key={a.account_id}
                    value={a.account_id.toString()}
                  >
                    {a.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v: any) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-[110px]">
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
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onActivate={handleBulkActivate}
        onPause={handleBulkPause}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
      />

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-14">On/Off</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-24">Status</TableHead>
                {viewLevel === "campaigns" && (
                  <TableHead className="w-32">Orçamento</TableHead>
                )}
                {viewLevel === "adsets" && (
                  <TableHead className="w-24">Bid</TableHead>
                )}
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
                      <Skeleton className="h-5 w-9" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-gray-500"
                  >
                    {searchQuery ? "Nenhum resultado" : "Nenhum item"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const id = getItemId(item);
                  const isClickable = viewLevel !== "ads";

                  return (
                    <TableRow
                      key={id}
                      className={`${
                        selectedIds.has(id) ? "bg-blue-50" : ""
                      } ${isClickable ? "cursor-pointer hover:bg-gray-50" : ""}`}
                      onClick={() => {
                        if (viewLevel === "campaigns")
                          navigateToCampaign(item);
                        else if (viewLevel === "adsets")
                          navigateToAdSet(item);
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(id)}
                          onCheckedChange={(c) => handleSelectOne(id, !!c)}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatusToggle
                          isActive={item.openStatus === 1}
                          onToggle={(s) => handleStatusToggle(id, s)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {getItemName(item)}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {id}
                            </div>
                          </div>
                          {isClickable && (
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={item.openStatus === 1 ? "active" : "paused"}
                        />
                      </TableCell>
                      {viewLevel === "campaigns" && (
                        <TableCell>
                          <div className="text-sm">
                            {formatCurrencyBRL(item.campaignBudget) || "-"}
                            <div className="text-xs text-gray-400">
                              {item.campaignBudgetType === 1
                                ? "Diário"
                                : "Vitalício"}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {viewLevel === "adsets" && (
                        <TableCell>
                          {formatCurrencyBRL(item.bid)}
                        </TableCell>
                      )}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleEdit(item, e)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {viewLevel === "campaigns" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDuplicate(id, e)}
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
