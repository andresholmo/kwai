// Types baseados na documentação Kwai Marketing API

export interface KwaiErrorResponse {
  status: number;
  message: string;
  requestId: string;
  host: string;
  port: number;
  timestamp: number;
}

export interface KwaiTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface KwaiAccount {
  accountId: string;
  accountName: string;
  accountType: string;
  status: string;
  balance?: number;
  currency?: string;
}

export interface KwaiCampaign {
  campaignId: string;
  campaignName: string;
  accountId: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  objective?: string;
}

export interface KwaiAdSet {
  adSetId: string;
  adSetName: string;
  campaignId: string;
  status: string;
  budget?: number;
  targeting?: Record<string, unknown>;
}

export interface KwaiCreative {
  creativeId: string;
  creativeName: string;
  adSetId: string;
  status: string;
  type?: string;
  materials?: string[];
}

export interface KwaiReport {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

