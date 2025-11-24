"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Video,
  Image,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MaterialsPage() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/kwai/accounts");
    const data = await res.json();
    if (data.success && data.accounts.length > 0) {
      setAccounts(data.accounts);
      setSelectedAccount(data.accounts[0].account_id.toString());
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kwai/materials?accountId=${selectedAccount}`);
      const data = await res.json();

      if (data.success) {
        setMaterials(data.materials || []);
        setApiAvailable(!data.warning);
      }
    } catch (error: any) {
      console.error("Erro:", error);
      setApiAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiais</h1>
          <p className="text-gray-500">Seus vídeos e imagens para anúncios</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Upload Material
        </Button>
      </div>

      {!apiAvailable && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>API de materiais indisponível.</strong> A API do Kwai para materiais pode não
            estar acessível com suas permissões atuais. Para fazer upload de materiais, use o
            <a
              href="https://ads.kwai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Kwai Ads Manager <ExternalLink className="inline h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Biblioteca de Materiais</CardTitle>
              <CardDescription>
                Vídeos e imagens disponíveis para criar criativos
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
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

              <Button onClick={fetchMaterials} variant="outline" size="icon" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">Nenhum material encontrado.</p>
              <p className="text-sm text-gray-400 mb-6">
                Faça upload de vídeos e imagens pelo Kwai Ads Manager
              </p>
              <Button
                variant="outline"
                onClick={() => window.open("https://ads.kwai.com", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Kwai Ads Manager
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {materials.map((material) => (
                <div
                  key={material.materialId}
                  className="border rounded-lg p-4 space-y-2 hover:border-blue-300 transition-colors"
                >
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                    {material.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={material.coverUrl}
                        alt={material.materialName}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : material.materialType === 1 ? (
                      <Video className="h-8 w-8 text-gray-400" />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" title={material.materialName}>
                    {material.materialName}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {material.materialType === 1 ? "Vídeo" : "Imagem"}
                    </Badge>
                    {material.duration && (
                      <span className="text-xs text-gray-500">
                        {Math.round(material.duration)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DICA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Dica</h3>
          <p className="text-sm text-blue-700">Para melhores resultados, seus vídeos devem ter:</p>
          <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
            <li>Formato vertical (9:16) para melhor performance</li>
            <li>Duração entre 15-60 segundos</li>
            <li>Resolução mínima de 720p</li>
            <li>Formato MP4 ou MOV</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
