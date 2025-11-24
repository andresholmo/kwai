export interface Campaign {
  campaignId: number;
  campaignName: string;
  openStatus: number;
  status: number;
  marketingGoal: number;
  objective: number;
  adCategory: number;
  campaignBudgetType: number;
  campaignBudget: number;
  // Métricas
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  // Contadores
  adSetsCount?: number;
  adsCount?: number;
}

export interface AdSet {
  unitId: number;
  unitName: string;
  campaignId: number;
  campaignName?: string;
  openStatus: number;
  status: number;
  bidType: number;
  bid: number;
  dayBudget: number;
  websiteUrl: string;
  optimizeTarget: number;
  gender: number;
  // Métricas
  impressions?: number;
  clicks?: number;
  spend?: number;
  conversions?: number;
  reach?: number;
  // Contadores
  adsCount?: number;
}

export interface Ad {
  creativeId: number;
  creativeName: string;
  unitId: number;
  unitName?: string;
  campaignId?: number;
  campaignName?: string;
  openStatus: number;
  status: number;
  materialId: number;
  actionType: number;
  actionUrl: string;
  // Métricas
  impressions?: number;
  clicks?: number;
  spend?: number;
  ctr?: number;
}

export type TabType = "campaigns" | "adsets" | "ads";

export interface FilterState {
  search: string;
  status: "all" | "active" | "paused";
  dateRange: {
    start: Date;
    end: Date;
  };
}

