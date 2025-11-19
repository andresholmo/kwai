import axios, { AxiosInstance, AxiosError } from "axios";
import type { KwaiErrorResponse, KwaiTokenResponse } from "./types";

class KwaiAPIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.KWAI_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para adicionar token automaticamente
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers["Access-Token"] = this.accessToken;
      }
      return config;
    });

    // Interceptor para tratamento de erros baseado na documentação
    this.client.interceptors.response.use(
      (response) => {
        // Status 200 com data.status !== 200 é erro
        if (response.data?.status && response.data.status !== 200) {
          return Promise.reject(response.data);
        }
        return response;
      },
      async (error: AxiosError<KwaiErrorResponse>) => {
        const originalRequest = error.config;

        // Token expirado (401)
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAccessToken();
            if (originalRequest) {
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  async refreshAccessToken(): Promise<KwaiTokenResponse> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post<KwaiTokenResponse>(
      process.env.KWAI_TOKEN_URL!,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
        client_id: process.env.KWAI_CLIENT_ID!,
        client_secret: process.env.KWAI_CLIENT_SECRET!,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    this.setTokens(access_token, refresh_token);

    return response.data;
  }

  // Métodos da API

  /**
   * Busca contas do agente ou corporação
   */
  async getAccounts(params: {
    agentId?: string;
    corpId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const response = await this.client.post(
      "/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
      params
    );
    return response.data;
  }

  /**
   * Busca campanhas
   */
  async getCampaigns(params: {
    accountId: string;
    page?: number;
    pageSize?: number;
  }) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/list",
      params
    );
    return response.data;
  }

  /**
   * Cria uma nova campanha
   */
  async createCampaign(params: {
    accountId: string;
    campaignName: string;
    budget?: number;
    startDate?: string;
    endDate?: string;
    objective?: string;
  }) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/create",
      params
    );
    return response.data;
  }

  /**
   * Busca ad sets
   */
  async getAdSets(params: {
    campaignId: string;
    page?: number;
    pageSize?: number;
  }) {
    const response = await this.client.post(
      "/rest/n/mapi/adset/list",
      params
    );
    return response.data;
  }

  /**
   * Busca criativos
   */
  async getCreatives(params: {
    adSetId: string;
    page?: number;
    pageSize?: number;
  }) {
    const response = await this.client.post(
      "/rest/n/mapi/creative/list",
      params
    );
    return response.data;
  }

  /**
   * Busca relatórios
   */
  async getReports(params: {
    accountId?: string;
    campaignId?: string;
    adSetId?: string;
    startDate: string;
    endDate: string;
    groupBy?: string[];
  }) {
    const response = await this.client.post(
      "/rest/n/mapi/report/query",
      params
    );
    return response.data;
  }
}

export const kwaiClient = new KwaiAPIClient();

