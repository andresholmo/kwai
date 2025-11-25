"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function ReviewStep({ data }: any) {
  const issues: string[] = [];

  // Validar campanha
  if (!data.campaign?.campaignName) issues.push("Nome da campanha não definido");
  if (!data.campaign?.accountId) issues.push("Conta não selecionada");

  // Validar ad sets
  if (data.adSets.length === 0) {
    issues.push("Nenhum conjunto de anúncios adicionado");
  } else {
    data.adSets.forEach((adSet: any, i: number) => {
      if (!adSet.unitName) issues.push(`Ad Set ${i + 1}: nome não definido`);
      if (!adSet.websiteUrl) issues.push(`Ad Set ${i + 1}: URL não definida`);
      if (!adSet.bid || adSet.bid <= 0) issues.push(`Ad Set ${i + 1}: lance inválido`);
    });
  }

  // Validar criativos
  if (data.creatives.length === 0) {
    issues.push("Nenhum criativo adicionado");
  } else {
    data.creatives.forEach((creative: any, i: number) => {
      if (!creative.creativeName) issues.push(`Criativo ${i + 1}: nome não definido`);
      if (!creative.actionUrl) issues.push(`Criativo ${i + 1}: URL não definida`);
      // Verificar se adSetIndex é válido
      if (
        creative.adSetIndex === undefined ||
        creative.adSetIndex < 0 ||
        creative.adSetIndex >= data.adSets.length
      ) {
        issues.push(`Criativo ${i + 1}: conjunto de anúncios inválido`);
      }
    });
  }

  if (!data.campaign) {
    return <p className="text-center text-gray-500 py-8">Nenhum dado para revisar</p>;
  }

  return (
    <div className="space-y-6">
      {/* Alertas de validação */}
      {issues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Problemas encontrados:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {issues.map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Resumo da campanha */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nome:</span>
              <p className="font-medium">{data.campaign?.campaignName || "-"}</p>
            </div>
            <div>
              <span className="text-gray-500">Objetivo:</span>
              <p className="font-medium">
                {data.campaign?.marketingGoal === 1
                  ? "Awareness"
                  : data.campaign?.marketingGoal === 2
                    ? "Consideration"
                    : "Conversion"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Destino:</span>
              <p className="font-medium">{data.campaign?.objective === 1 ? "App" : "Website"}</p>
            </div>
            <div>
              <span className="text-gray-500">Orçamento:</span>
              <p className="font-medium">
                {data.campaign?.campaignBudget
                  ? `R$ ${(data.campaign.campaignBudget / 1000000).toFixed(2)}`
                  : "Não definido"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conjuntos */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Conjuntos de Anúncios ({data.adSets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.adSets.length > 0 ? (
            <div className="space-y-3">
              {data.adSets.map((adSet: any, i: number) => (
                <div key={i} className="border rounded-lg p-3">
                  <p className="font-medium">{adSet.unitName}</p>
                  <p className="text-sm text-gray-600">{adSet.websiteUrl}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Lance: R$ {(adSet.bid / 1000000).toFixed(2)}
                    {adSet.dayBudget &&
                      ` | Orçamento: R$ ${(adSet.dayBudget / 1000000).toFixed(2)}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum conjunto adicionado</p>
          )}
        </CardContent>
      </Card>

      {/* Criativos */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Criativos ({data.creatives.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.creatives.length > 0 ? (
            <div className="space-y-3">
              {data.creatives.map((creative: any, i: number) => (
                <div key={i} className="border rounded-lg p-3">
                  <p className="font-medium">{creative.creativeName}</p>
                  <p className="text-sm text-gray-600">{creative.description || creative.actionUrl}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Para: {data.adSets[creative.adSetIndex]?.unitName || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum criativo adicionado</p>
          )}
        </CardContent>
      </Card>

      {/* Resumo final */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Pronto para salvar!</h3>
              <p className="text-sm text-green-700 mt-1">
                {data.adSets.length} conjunto(s) • {data.creatives.length} criativo(s)
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

