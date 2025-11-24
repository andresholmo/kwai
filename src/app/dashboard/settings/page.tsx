"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Key,
  RefreshCw,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_VERSION, BUILD_DATE } from "@/lib/version";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchTokenInfo();
    fetchAccounts();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    }
  };

  const fetchTokenInfo = async () => {
    try {
      const res = await fetch("/api/kwai/check-token");
      const data = await res.json();
      setTokenInfo(data);
    } catch (error) {
      console.error("Erro ao verificar token:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/kwai/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  };

  const handleRefreshToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kwai/refresh-token", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "✅ Token renovado!",
          description: "Conexão atualizada com sucesso.",
        });
        fetchTokenInfo();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao renovar token",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Tem certeza que deseja desconectar do Kwai? Você precisará reconectar para gerenciar campanhas."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/kwai/disconnect", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "Desconectado",
          description: "Você foi desconectado do Kwai.",
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kwai/sync-accounts", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        toast({
          title: "✅ Contas sincronizadas!",
          description: `${data.accounts || data.message || "Contas atualizadas"}.`,
        });
        fetchAccounts();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-500">Gerencie sua conta e conexões</p>
      </div>

      {/* INFORMAÇÕES DO USUÁRIO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">ID do Usuário</Label>
                  <p className="font-mono text-sm">{user.id?.substring(0, 8)}...</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Carregando...</p>
          )}
        </CardContent>
      </Card>

      {/* CONEXÃO KWAI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Conexão com Kwai
          </CardTitle>
          <CardDescription>Status da sua conexão com o Kwai Business Center</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenInfo?.connected ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-600">Conectado</span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-gray-500 text-xs">Token expira em</Label>
                    <p className="font-medium">
                      {tokenInfo.minutesRemaining} minutos
                      {tokenInfo.minutesRemaining <= 10 && (
                        <Badge className="ml-2 bg-orange-100 text-orange-800">Renovando...</Badge>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Auto-refresh</Label>
                  <p className="font-medium text-green-600">Ativo</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRefreshToken} variant="outline" disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Renovar Token Agora
                </Button>
                <Button onClick={handleDisconnect} variant="destructive" disabled={loading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Você não está conectado ao Kwai.
                </AlertDescription>
              </Alert>
              <Button onClick={() => router.push("/dashboard/connect")}>
                Conectar ao Kwai
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* CONTAS VINCULADAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Contas de Anúncios
              </CardTitle>
              <CardDescription>Contas do Kwai vinculadas ao seu usuário</CardDescription>
            </div>
            <Button onClick={handleSyncAccounts} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.account_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{account.account_name}</p>
                    <p className="text-sm text-gray-500">ID: {account.account_id}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {account.status || "Ativa"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Nenhuma conta vinculada</p>
          )}
        </CardContent>
      </Card>

      {/* SOBRE O SISTEMA */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-500">Versão</Label>
              <p className="font-mono">v{APP_VERSION}</p>
            </div>
            <div>
              <Label className="text-gray-500">Data do Build</Label>
              <p className="font-mono">{BUILD_DATE}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
