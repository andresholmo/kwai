"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function EmergencyConnectPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const authUrl = `https://business.kwai.com/oauth/authorize?client_id=jt88XekW&response_type=code&redirect_uri=https://kwai.grupoupmidia.com.br/api/auth/callback&state=emergency`;

  const handleConnect = async () => {
    if (!code) {
      alert("Por favor, cole o código de autorização");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/kwai/emergency-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Conexão de Emergência - Kwai</CardTitle>
          <CardDescription>
            Use este método apenas se o OAuth normal não estiver funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Passo a Passo:</strong>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="border p-4 rounded space-y-3">
              <h3 className="font-semibold">1. Obter código de autorização</h3>
              <p className="text-sm text-gray-600">
                Clique no botão abaixo para abrir a página de autorização do Kwai:
              </p>
              <Button
                onClick={() => window.open(authUrl, "_blank")}
                variant="outline"
              >
                Abrir Autorização do Kwai
              </Button>
            </div>

            <div className="border p-4 rounded space-y-3">
              <h3 className="font-semibold">2. Autorizar e copiar o código</h3>
              <p className="text-sm text-gray-600">
                Após autorizar, você será redirecionado para uma URL como:
              </p>
              <code className="block bg-gray-100 p-2 text-xs rounded">
                https://kwai.grupoupmidia.com.br/api/auth/callback?code=XXXXX&state=emergency
              </code>
              <p className="text-sm text-gray-600">
                Copie apenas o valor após &quot;code=&quot; e antes de &quot;&state&quot;
              </p>
            </div>

            <div className="border p-4 rounded space-y-3">
              <h3 className="font-semibold">3. Cole o código aqui</h3>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Cole o código de autorização aqui"
              />
              <Button
                onClick={handleConnect}
                disabled={loading || !code}
                className="w-full"
              >
                {loading ? "Conectando..." : "Conectar"}
              </Button>
            </div>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

