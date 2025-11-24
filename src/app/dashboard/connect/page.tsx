"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConnectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Para inserção manual
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const handleManualToken = async () => {
    if (!accessToken.trim() || !refreshToken.trim()) {
      toast({
        title: "Erro",
        description: "Preencha ambos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/kwai/manual-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken.trim(),
          refresh_token: refreshToken.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "Conectado com sucesso!",
          description: `${data.accounts} conta(s) sincronizada(s)`,
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Conectar ao Kwai</h1>
        <p className="text-gray-500 mt-2">
          Conecte sua conta do Kwai Business Center para gerenciar campanhas
        </p>
      </div>

      <Tabs defaultValue="automatic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automatic">Conexão Automática</TabsTrigger>
          <TabsTrigger value="manual">Conexão Manual</TabsTrigger>
        </TabsList>

        {/* CONEXÃO AUTOMÁTICA */}
        <TabsContent value="automatic">
          <Card>
            <CardHeader>
              <CardTitle>Conexão via OAuth</CardTitle>
              <CardDescription>
                Siga os passos abaixo para conectar automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Importante:</strong> Você deve estar logado no Kwai Business Center no
                  MESMO navegador antes de clicar em &quot;Conectar&quot;.
                </AlertDescription>
              </Alert>

              <div
                className={`p-4 border rounded-lg ${
                  step >= 1 ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="font-semibold">Fazer login no Kwai Business Center</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Abra o link abaixo em uma <strong>nova aba</strong> e faça login com sua conta:
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open("https://business.kwai.com/", "_blank");
                    setStep(2);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Kwai Business Center
                </Button>
              </div>

              <div
                className={`p-4 border rounded-lg ${
                  step >= 2 ? "border-blue-500 bg-blue-50" : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="font-semibold">Confirmar que está logado</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Certifique-se de que seu nome aparece no canto superior direito do Business Center.
                </p>
                <Button variant="outline" disabled={step < 2} onClick={() => setStep(3)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Estou logado
                </Button>
              </div>

              <div
                className={`p-4 border rounded-lg ${
                  step >= 3 ? "border-green-500 bg-green-50" : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="font-semibold">Autorizar conexão</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Clique no botão abaixo para autorizar o acesso. Você será redirecionado de volta
                  automaticamente.
                </p>
                <Button
                  disabled={step < 3}
                  onClick={() => (window.location.href = "/api/kwai/auth")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Conectar ao Kwai
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONEXÃO MANUAL */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Inserir Token Manualmente</CardTitle>
              <CardDescription>
                Use esta opção se a conexão automática não funcionar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Como obter os tokens:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Abra o Kwai Business Center e faça login</li>
                    <li>Acesse as configurações da API</li>
                    <li>Gere um novo token de acesso</li>
                    <li>Copie o access_token e refresh_token</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="accessToken">Access Token *</Label>
                  <Textarea
                    id="accessToken"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Cole o access_token aqui"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="refreshToken">Refresh Token *</Label>
                  <Textarea
                    id="refreshToken"
                    value={refreshToken}
                    onChange={(e) => setRefreshToken(e.target.value)}
                    placeholder="Cole o refresh_token aqui"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleManualToken}
                  disabled={loading || !accessToken || !refreshToken}
                  className="w-full"
                >
                  {loading ? "Conectando..." : "Salvar e Conectar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Problemas para conectar? Entre em contato com o suporte.</p>
      </div>
    </div>
  );
}

