"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Video, Image } from "lucide-react";

export default function MaterialsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/kwai/accounts");
    const data = await res.json();
    if (data.success) {
      setAccounts(data.accounts);
      if (data.accounts.length > 0) {
        setSelectedAccount(data.accounts[0].account_id.toString());
      }
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
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error("Erro:", error);
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Biblioteca de Materiais</CardTitle>
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

              <Button
                onClick={fetchMaterials}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum material encontrado. Faça upload do seu primeiro vídeo ou
              imagem!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {materials.map((material) => (
                <div
                  key={material.materialId}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                    {material.materialType === 1 ? (
                      <Video className="h-8 w-8 text-gray-400" />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">
                    {material.materialName}
                  </p>
                  <Badge variant="outline">
                    {material.materialType === 1 ? "Vídeo" : "Imagem"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
