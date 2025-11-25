"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function ReviewStep({ data }: any) {
  const getMarketingGoalName = (goal: number) => {
    switch (goal) {
      case 1:
        return "Awareness";
      case 2:
        return "Consideration";
      case 3:
        return "Conversion";
      default:
        return "Desconhecido";
    }
  };

  const getObjectiveName = (obj: number) => {
    switch (obj) {
      case 1:
        return "App";
      case 2:
        return "Website";
      default:
        return "Desconhecido";
    }
  };

  const getActionTypeName = (type: number) => {
    const types: { [key: number]: string } = {
      1: "Saiba Mais",
      2: "Download",
      3: "Comprar Agora",
      4: "Inscreva-se",
      5: "Assistir",
    };
    return types[type] || "Desconhecido";
  };

  if (!data.campaign) {
    return <p className="text-center text-gray-500 py-8">Nenhum dado para revisar</p>;
  }

  return (
    <div className="space-y-4">
      {/* Campanha */}
      <Card>
        <CardHeader>
          <CardTitle>Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Nome:</span>
            <span className="font-medium">{data.campaign.campaignName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Objetivo:</span>
            <Badge>{getMarketingGoalName(data.campaign.marketingGoal)}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Destino:</span>
            <Badge variant="outline">{getObjectiveName(data.campaign.objective)}</Badge>
          </div>
          {data.campaign.campaignBudget && (
            <div className="flex justify-between">
              <span className="text-gray-600">Orçamento:</span>
              <span className="font-medium">
                R$ {(data.campaign.campaignBudget / 1000000).toFixed(2)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Sets */}
      <Card>
        <CardHeader>
          <CardTitle>Conjuntos de Anúncios ({data.adSets.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.adSets.map((adSet: any, index: number) => (
            <div key={index}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{adSet.unitName}</h4>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <p>URL: {adSet.websiteUrl}</p>
                  <p>Lance: R$ {(adSet.bid / 1000000).toFixed(2)}</p>
                  {adSet.dayBudget && (
                    <p>Orçamento Diário: R$ {(adSet.dayBudget / 1000000).toFixed(2)}</p>
                  )}
                </div>
              </div>
              {index < data.adSets.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Criativos */}
      <Card>
        <CardHeader>
          <CardTitle>Criativos ({data.creatives.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.creatives.map((creative: any, index: number) => (
            <div key={index}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{creative.creativeName}</h4>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                  <p>
                    Conjunto: {data.adSets[creative.adSetIndex]?.unitName || "N/A"}
                  </p>
                  {creative.description && <p>Descrição: {creative.description}</p>}
                  <p>URL: {creative.actionUrl}</p>
                  <p>Ação: {getActionTypeName(creative.actionType)}</p>
                </div>
              </div>
              {index < data.creatives.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-sm space-y-1">
            <p className="font-semibold text-green-900">Resumo Final:</p>
            <p>1 Campanha</p>
            <p>{data.adSets.length} Conjunto(s) de Anúncios</p>
            <p>{data.creatives.length} Criativo(s)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

