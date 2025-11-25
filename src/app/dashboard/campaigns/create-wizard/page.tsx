"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

// Importar steps
import { CampaignStep } from "@/components/wizard/campaign-step";
import { AdSetsStep } from "@/components/wizard/ad-sets-step";
import { CreativesStep } from "@/components/wizard/creatives-step";
import { ReviewStep } from "@/components/wizard/review-step";
import { reaisToMicro } from "@/lib/utils";

type WizardData = {
  campaign: {
    accountId: string;
    campaignName: string;
    marketingGoal: number;
    objective: number;
    campaignBudgetType?: number;
    campaignBudget?: number;
  } | null;
  adSets: Array<{
    unitName: string;
    websiteUrl: string;
    optimizationGoal: number;
    bidType: number;
    bid: number;
    dayBudget?: number;
    gender: number;
  }>;
  creatives: Array<{
    adSetIndex: number; // Qual ad set este criativo pertence
    creativeName: string;
    description: string;
    actionUrl: string;
    actionType: number;
    materialId?: number;
  }>;
};

export default function CreateWizardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [wizardData, setWizardData] = useState<WizardData>({
    campaign: null,
    adSets: [],
    creatives: [],
  });

  const steps = [
    { title: "Campanha", component: CampaignStep },
    { title: "Conjuntos", component: AdSetsStep },
    { title: "Criativos", component: CreativesStep },
    { title: "Revisar", component: ReviewStep },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return !!wizardData.campaign;
      case 1:
        return wizardData.adSets.length > 0;
      case 2:
        return wizardData.creatives.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);

    try {
      // 1. Criar campanha
      toast({ title: "1/3 Criando campanha..." });
      const campaignRes = await fetch("/api/kwai/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: parseInt(wizardData.campaign!.accountId),
          campaignData: {
            campaignName: wizardData.campaign!.campaignName,
            marketingGoal: wizardData.campaign!.marketingGoal,
            objective: wizardData.campaign!.objective,
            campaignBudgetType: wizardData.campaign!.campaignBudgetType,
            campaignBudget: wizardData.campaign!.campaignBudget,
          },
        }),
      });

      const campaignData = await campaignRes.json();
      if (!campaignData.success) throw new Error(campaignData.error || "Erro ao criar campanha");

      const campaignId =
        campaignData.campaign?.campaignId ||
        campaignData.campaign?.[0]?.campaignId ||
        campaignData.campaignId;

      if (!campaignId) throw new Error("CampaignId não encontrado na resposta");

      // 2. Criar ad sets
      toast({ title: "2/3 Criando conjuntos de anúncios..." });
      const adSetIds: number[] = [];

      for (const adSet of wizardData.adSets) {
        const adSetRes = await fetch("/api/kwai/ad-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: parseInt(wizardData.campaign!.accountId),
            adSetData: {
              campaignId: campaignId,
              unitName: adSet.unitName,
              websiteUrl: adSet.websiteUrl,
              optimizeTarget: adSet.optimizationGoal,
              bidType: adSet.bidType,
              bid: adSet.bid,
              ...(adSet.dayBudget && { unitBudget: adSet.dayBudget }),
              scheduleStartTime: new Date().toISOString().split("T")[0] + " 00:00:00",
              gender: adSet.gender === 3 ? 0 : adSet.gender,
              region: [76], // Brasil
            },
          }),
        });

        const adSetData = await adSetRes.json();
        if (!adSetData.success)
          throw new Error(adSetData.error || `Erro ao criar ad set: ${adSet.unitName}`);

        const unitId = adSetData.adSet?.unitId || adSetData.adSet?.[0]?.unitId || adSetData.unitId;

        if (unitId) adSetIds.push(unitId);
      }

      // 3. Criar criativos
      toast({ title: "3/3 Criando criativos..." });

      for (const creative of wizardData.creatives) {
        const unitId = adSetIds[creative.adSetIndex];
        if (!unitId) continue;

        const creativeRes = await fetch("/api/kwai/creatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: parseInt(wizardData.campaign!.accountId),
            creativeData: {
              unitId: unitId,
              creativeName: creative.creativeName,
              description: creative.description,
              actionUrl: creative.actionUrl,
              actionType: creative.actionType,
              ...(creative.materialId && { materialId: creative.materialId }),
            },
          }),
        });

        const creativeData = await creativeRes.json();
        if (!creativeData.success) {
          console.error(`Erro ao criar criativo: ${creative.creativeName}`);
        }
      }

      // Sucesso!
      toast({
        title: "✅ Tudo criado com sucesso!",
        description: `Campanha "${wizardData.campaign!.campaignName}" com ${wizardData.adSets.length} conjunto(s) e ${wizardData.creatives.length} criativo(s)`,
      });

      router.push("/dashboard/campaigns");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Criar Campanha Completa</h1>
        <p className="text-gray-500">Configure tudo antes de salvar</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Passo {currentStep + 1} de {steps.length}
              </span>
              <span className="text-gray-500">{steps[currentStep].title}</span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} />
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${
                    index < currentStep
                      ? "bg-green-500 border-green-500 text-white"
                      : index === currentStep
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                  }
                `}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${index === currentStep ? "font-semibold" : ""}`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-200 ml-2 flex-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent data={wizardData} onUpdate={setWizardData} />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Cancelar
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSaveAll}
              disabled={saving || !canGoNext()}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? "Salvando..." : "Salvar Tudo"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      {wizardData.campaign && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-sm space-y-1">
              <p>
                <strong>Campanha:</strong> {wizardData.campaign.campaignName}
              </p>
              <p>
                <strong>Conjuntos:</strong> {wizardData.adSets.length}
              </p>
              <p>
                <strong>Criativos:</strong> {wizardData.creatives.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

