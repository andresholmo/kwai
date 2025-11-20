import axios, { AxiosInstance, AxiosError } from "axios";

export interface KwaiTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface KwaiAccount {
  accountId: number;
  accountName: string;
  accountType: "advertiser" | "agency";
  currency: string;
  timezone: string;
}

class KwaiAPI {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.KWAI_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para adicionar token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers["Access-Token"] = this.accessToken;
      }
      return config;
    });

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => {
        // Kwai retorna status 200 com data.status diferente de 200 em caso de erro
        if (response.data?.status && response.data.status !== 200) {
          return Promise.reject(response.data);
        }
        return response;
      },
      async (error: AxiosError<any>) => {
        const originalRequest = error.config as any;

        // Token expirado (401) - tentar refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Aqui seria ideal buscar o refresh_token do banco
          // Por enquanto, apenas rejeita
          console.error("Token expired - needs manual refresh");
        }

        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Obter token de acesso usando authorization code
   */
  async getAccessToken(code: string): Promise<KwaiTokenResponse> {
    const response = await axios.post<KwaiTokenResponse>(
      process.env.KWAI_TOKEN_URL!,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.KWAI_CLIENT_ID!,
        client_secret: process.env.KWAI_CLIENT_SECRET!,
        redirect_uri: process.env.KWAI_REDIRECT_URI!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<KwaiTokenResponse> {
    const response = await axios.post<KwaiTokenResponse>(
      process.env.KWAI_TOKEN_URL!,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.KWAI_CLIENT_ID!,
        client_secret: process.env.KWAI_CLIENT_SECRET!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  }

  /**
   * Refresh access token automaticamente
   */
  async refreshToken(refreshToken: string): Promise<KwaiTokenResponse> {
    const response = await axios.post<KwaiTokenResponse>(
      process.env.KWAI_TOKEN_URL!,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.KWAI_CLIENT_ID!,
        client_secret: process.env.KWAI_CLIENT_SECRET!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  }

  /**
   * Buscar lista de contas
   */
  async getAccounts(): Promise<KwaiAccount[]> {
    const agentId = parseInt(process.env.KWAI_AGENT_ID || "76407091");

    console.log("Buscando contas com agentId:", agentId);

    const response = await this.client.post(
      "/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
      { agentId }
    );

    console.log("Contas encontradas:", response.data.data?.total || 0);
    return response.data.data?.data || [];
  }


  /**
   * Buscar relatório de performance
   */
  async getPerformanceReport(
    accountId: number,
    params: {
      granularity: number;
      dataBeginTime: number;
      dataEndTime: number;
      timeZoneIana: string;
      pageNo: number;
      pageSize: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/report/dspAccountEffectQuery",
      {
        accountId,
        ...params,
      }
    );
    return response.data.data;
  }

  /**
   * Listar campanhas
   */
  async getCampaigns(
    accountId: number,
    params?: {
      pageNo?: number;
      pageSize?: number;
      campaignIds?: number[];
      adCategory?: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignPageQueryPerformance",
      {
        accountId,
        adCategory: params?.adCategory || 1, // 1=Entertainment, 2=E-commerce, 4=Others (obrigatório!)
        pageNo: params?.pageNo || 1,
        pageSize: params?.pageSize || 20,
        ...(params?.campaignIds && { campaignIds: params.campaignIds }),
      }
    );
    return response.data.data;
  }

  /**
   * Criar campanha
   */
  async createCampaign(
    accountId: number,
    campaignData: {
      campaignName: string;
      marketingGoal: number; // 1=Awareness, 2=Consideration, 3=Conversion
      objective: number; // 1=App, 2=Website
      campaignBudgetType?: number; // 1=Daily, 2=Lifetime
      campaignBudget?: number; // em centavos
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignAddPerformance",
      {
        accountId,
        ...campaignData,
      }
    );
    return response.data.data;
  }

  /**
   * Atualizar status da campanha (on/off)
   */
  async updateCampaignStatus(
    accountId: number,
    campaignId: number,
    openStatus: number
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignUpdateOpenStatusPerformance",
      {
        accountId,
        campaignId,
        openStatus, // 0=Off, 1=On
      }
    );
    return response.data;
  }

  /**
   * Deletar campanha
   */
  async deleteCampaign(accountId: number, campaignId: number) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignDeletePerformance",
      {
        accountId,
        campaignId,
      }
    );
    return response.data;
  }
}

export const kwaiAPI = new KwaiAPI();


