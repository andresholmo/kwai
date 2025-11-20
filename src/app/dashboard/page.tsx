"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  Target,
  Image,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useKwaiConnection } from "@/hooks/useKwaiConnection";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, accounts, loading, connect } = useKwaiConnection();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se voltou do OAuth
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    const warning = searchParams.get("warning");

    if (connected === "true") {
      if (warning === "no_accounts") {
        toast({
          title: "Conectado com sucesso!",
          description:
            "Porém, nenhuma conta foi encontrada. Verifique se você tem contas ativas no Kwai Business Center.",
          variant: "default",
        });
      } else {
        toast({
          title: "Conectado com sucesso!",
          description: "Sua conta do Kwai foi conectada ao dashboard.",
        });
      }
    }

    if (error) {
      toast({
        title: "Erro na conexão",
        description: `Não foi possível conectar: ${error}`,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          Visão geral das suas campanhas no Kwai
        </p>
      </div>

      {/* Status de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Conectado ao Kwai
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Não conectado ao Kwai
                </>
              )}
            </div>
            {isConnected && (
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/kwai/refresh-token", {
                      method: "POST",
                    });
                    const data = await res.json();

                    if (data.success) {
                      toast({
                        title: "Token renovado!",
                        description: "Seu acesso foi renovado com sucesso.",
                      });
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      toast({
                        title: "Erro ao renovar token",
                        description: data.error,
                        variant: "destructive",
                      });
                    }
                  } catch (error: any) {
                    toast({
                      title: "Erro",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                size="sm"
              >
                Renovar Token
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {accounts.length} conta(s) sincronizada(s)
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/kwai/sync-accounts", {
                        method: "POST",
                      });
                      const data = await response.json();
                      if (data.success) {
                        toast({
                          title: "Sucesso!",
                          description: data.message,
                        });
                        // Refresh accounts
                        window.location.reload();
                      } else {
                        toast({
                          title: "Erro",
                          description: data.error || "Erro ao sincronizar",
                          variant: "destructive",
                        });
                      }
                    } catch (error: any) {
                      toast({
                        title: "Erro",
                        description: error.message || "Erro ao sincronizar",
                        variant: "destructive",
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Sincronizar Contas Manualmente
                </Button>
              </div>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{account.account_name}</p>
                      <p className="text-sm text-gray-500">
                        ID: {account.account_id} • {account.account_type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Conecte sua conta do Kwai Business para começar a gerenciar suas
                campanhas.
              </p>
              <Button onClick={connect}>Conectar conta do Kwai</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">
              🎉 Todas as Permissões Aprovadas!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-green-800">
              O Kwai aprovou todas as permissões da API! Atualize o token para
              começar a criar campanhas.
            </p>
            <Button
              onClick={async () => {
                try {
                  const res = await fetch("/api/kwai/update-token", {
                    method: "POST",
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast({
                      title: "Token atualizado!",
                      description:
                        "Agora você pode criar campanhas, ad sets e fazer upload de materiais.",
                    });
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
                    toast({
                      title: "Erro",
                      description: data.error || "Erro ao atualizar token",
                      variant: "destructive",
                    });
                  }
                } catch (error: any) {
                  toast({
                    title: "Erro",
                    description: error.message || "Erro ao atualizar token",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Atualizar Token com Novas Permissões
            </Button>
          </CardContent>
        </Card>
      )}

      {!isConnected && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">
              Problemas para conectar?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Se o método normal não funcionar, use a conexão de emergência
            </p>
            <Button
              onClick={() => router.push("/dashboard/emergency-connect")}
              variant="outline"
            >
              Conexão de Emergência
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {isConnected && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Campanhas
              </CardTitle>
              <div className="rounded-full p-2 bg-blue-50">
                <Megaphone className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ad Sets
              </CardTitle>
              <div className="rounded-full p-2 bg-green-50">
                <Target className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Criativos
              </CardTitle>
              <div className="rounded-full p-2 bg-purple-50">
                <Image className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Materiais
              </CardTitle>
              <div className="rounded-full p-2 bg-orange-50">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


