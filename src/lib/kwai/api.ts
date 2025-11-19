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
          throw new Error(response.data.message || "Erro na API do Kwai");
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          throw new Error("Token inválido ou expirado");
        }
        throw error;
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
   * Buscar lista de contas
   * Nota: Esta API requer agentId (para agências) ou corpId (para anunciantes diretos)
   */
  async getAccounts(corpId?: number): Promise<KwaiAccount[]> {
    console.log("Chamando API do Kwai: getAccounts");
    console.log("Endpoint:", "/rest/n/mapi/report/crmAccountQueryByAgentOrCorp");
    console.log("Access Token configurado:", this.accessToken ? "Sim" : "Não");

    try {
      const body: any = {};

      // Usar corpId para anunciantes diretos
      if (corpId) {
        body.corpId = corpId;
        console.log("Using corpId:", corpId);
      }

      console.log("Request body:", JSON.stringify(body, null, 2));

      const response = await this.client.post(
        "/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
        body
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", JSON.stringify(response.headers, null, 2));
      console.log("Response data completo:", JSON.stringify(response.data, null, 2));

      const accounts = response.data.data?.data || [];
      console.log("Accounts found:", accounts.length);
      console.log("Estrutura de dados:", JSON.stringify(accounts, null, 2));

      return accounts;
    } catch (error: any) {
      console.error("Erro ao buscar contas:", error);
      console.error("Error response:", error.response?.data);
      console.error("Erro status:", error.response?.status);
      throw error;
    }
  }

  /**
   * Buscar dados de uma campanha
   */
  async getCampaigns(accountId: number, params: any) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignPageQueryPerformance",
      {
        accountId,
        ...params,
      }
    );
    return response.data.data;
  }

  /**
   * Criar campanha
   */
  async createCampaign(accountId: number, campaignData: any) {
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
}

export const kwaiAPI = new KwaiAPI();

