"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useKwaiConnection } from "@/hooks/useKwaiConnection";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { BarChart3, Calendar, Download, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportData {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

export default function ReportsPage() {
  const { isConnected, accounts, loading: connectionLoading } = useKwaiConnection();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [granularity, setGranularity] = useState<string>("1");
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Definir datas padrão (últimos 7 dias)
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(lastWeek.toISOString().split("T")[0]);
  }, []);

  const fetchReport = async () => {
    if (!selectedAccount || !startDate || !endDate) {
      setError("Por favor, selecione uma conta e defina o período");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Converter datas para timestamp Unix (milissegundos)
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      const response = await fetch("/api/kwai/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          granularity: parseInt(granularity),
          dataBeginTime: startTimestamp,
          dataEndTime: endTimestamp,
          timeZoneIana: "America/Sao_Paulo",
          pageNo: 1,
          pageSize: 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar relatório");
      }

      const { data } = await response.json();

      // Processar dados do relatório
      if (data?.data && Array.isArray(data.data)) {
        const processed = data.data
          .map((item: any) => {
            // Validar e converter data
            let reportDate: Date;
            try {
              if (item.dataDate) {
                reportDate = new Date(item.dataDate);
                if (isNaN(reportDate.getTime())) {
                  console.error("Data inválida:", item.dataDate);
                  reportDate = new Date();
                }
              } else if (item.date) {
                reportDate = new Date(item.date);
                if (isNaN(reportDate.getTime())) {
                  console.error("Data inválida:", item.date);
                  reportDate = new Date();
                }
              } else if (item.dataTime) {
                reportDate = new Date(item.dataTime);
                if (isNaN(reportDate.getTime())) {
                  console.error("Data inválida:", item.dataTime);
                  reportDate = new Date();
                }
              } else {
                reportDate = new Date();
              }
            } catch (e) {
              console.error("Erro ao processar data:", e, item);
              reportDate = new Date();
            }

            return {
              date: reportDate.toISOString().split("T")[0],
              impressions: item.impressions || item.showCount || 0,
              clicks: item.clicks || item.clickCount || 0,
              spend: item.spend || item.cost || 0,
              conversions: item.conversions || item.convertCount || 0,
              ctr:
                item.ctr ||
                (item.clickCount && item.showCount
                  ? (item.clickCount / item.showCount) * 100
                  : 0),
              cpc:
                item.cpc ||
                (item.clickCount && item.cost
                  ? item.cost / item.clickCount
                  : 0),
              cpm:
                item.cpm ||
                (item.showCount && item.cost
                  ? (item.cost / item.showCount) * 1000
                  : 0),
            };
          })
          .filter(Boolean); // Remove nulls
        setReportData(processed);
      } else {
        setReportData([]);
      }
    } catch (err: any) {
      console.error("Erro ao gerar relatório:", err);
      setError(err.message || "Erro ao buscar relatório");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais
  const totals = reportData.reduce(
    (acc, item) => ({
      impressions: acc.impressions + item.impressions,
      clicks: acc.clicks + item.clicks,
      spend: acc.spend + item.spend,
      conversions: acc.conversions + (item.conversions || 0),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );

  const avgCtr = totals.impressions > 0
    ? (totals.clicks / totals.impressions) * 100
    : 0;
  const avgCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const avgCpm = totals.impressions > 0
    ? (totals.spend / totals.impressions) * 1000
    : 0;

  if (connectionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize relatórios e análises das suas campanhas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conecte sua conta do Kwai</CardTitle>
            <CardDescription>
              Você precisa conectar sua conta do Kwai para visualizar relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/dashboard"}>
              Ir para Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize relatórios e análises das suas campanhas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione a conta e o período para gerar o relatório
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="account">Conta</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.account_id.toString()}
                    >
                      {account.account_name} ({account.account_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="granularity">Granularidade</Label>
              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger id="granularity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Diário</SelectItem>
                  <SelectItem value="2">Semanal</SelectItem>
                  <SelectItem value="3">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={fetchReport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      {reportData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totals.impressions)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totals.clicks)}
              </div>
              <p className="text-xs text-muted-foreground">
                CTR: {avgCtr.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totals.spend, "USD")}
              </div>
              <p className="text-xs text-muted-foreground">
                CPC: {formatCurrency(avgCpc, "USD")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totals.conversions)}
              </div>
              <p className="text-xs text-muted-foreground">
                CPM: {formatCurrency(avgCpm, "USD")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      {reportData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Impressões e Cliques</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#3b82f6"
                    name="Impressões"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10b981"
                    name="Cliques"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatDate(value)}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), "USD")} />
                  <Legend />
                  <Bar dataKey="spend" fill="#f59e0b" name="Gasto" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Detalhados</CardTitle>
            <CardDescription>
              Visualização completa dos dados do relatório
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Impressões</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Gasto</TableHead>
                    <TableHead>CPC</TableHead>
                    <TableHead>CPM</TableHead>
                    <TableHead>Conversões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{formatNumber(row.impressions)}</TableCell>
                      <TableCell>{formatNumber(row.clicks)}</TableCell>
                      <TableCell>
                        {row.ctr ? `${row.ctr.toFixed(2)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(row.spend, "USD")}
                      </TableCell>
                      <TableCell>
                        {row.cpc
                          ? formatCurrency(row.cpc, "USD")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {row.cpm
                          ? formatCurrency(row.cpm, "USD")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {row.conversions ? formatNumber(row.conversions) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há dados */}
      {!loading && reportData.length === 0 && !error && (
        <Card>
          <CardContent className="py-10 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Selecione os filtros e clique em &quot;Gerar Relatório&quot; para visualizar
              os dados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
