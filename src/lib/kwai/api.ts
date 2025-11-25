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
      adCategory?: number; // 1=Entertainment, 2=E-commerce, 4=Others
      campaignBudgetType?: number; // 1=Daily, 2=Lifetime
      campaignBudget?: number; // em micro-reais
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignAddPerformance",
      {
        accountId,
        adCategory: campaignData.adCategory || 1,
        // API espera um ARRAY de campanhas
        campaignAddModelList: [
          {
            campaignName: campaignData.campaignName,
            marketingGoal: campaignData.marketingGoal,
            objective: campaignData.objective,
            ...(campaignData.campaignBudgetType && {
              campaignBudgetType: campaignData.campaignBudgetType,
            }),
            ...(campaignData.campaignBudget && {
              campaignBudget: campaignData.campaignBudget,
            }),
          },
        ],
      }
    );
    return response.data.data;
  }

  /**
   * Atualizar status de campanha(s)
   */
  async updateCampaignStatus(
    accountId: number,
    campaignId: number | number[],
    openStatus: number
  ) {
    const campaignIdList = Array.isArray(campaignId) ? campaignId : [campaignId];

    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignUpdateOpenStatusPerformance",
      {
        accountId,
        campaignIdList,
        openStatus, // 0=Off, 1=On
        adCategory: 1,
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

  // ========== AD SETS (UNITS) ==========

  /**
   * Listar Ad Sets de uma campanha
   */
  async getAdSets(
    accountId: number,
    campaignId: number,
    params?: {
      pageNo?: number;
      pageSize?: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitPageQueryPerformance",
      {
        accountId,
        campaignId,
        adCategory: 1,
        pageNo: params?.pageNo || 1,
        pageSize: params?.pageSize || 20,
      }
    );
    return response.data.data;
  }

  /**
   * Criar Ad Set
   */
  async createAdSet(
    accountId: number,
    adSetData: {
      campaignId: number;
      unitName: string;
      optimizeTarget: number; // 1=Click, 2=Impression, 3=Conversion
      bidType: number; // 1=CPC, 2=CPM, 3=oCPC
      bid: number; // em centavos
      unitBudget: number; // em centavos
      scheduleStartTime: string; // formato: "2024-01-01 00:00:00"
      scheduleEndTime?: string;
      // Targeting
      region?: number[]; // IDs de regiões
      gender?: number; // 0=All, 1=Male, 2=Female
      ageMin?: number;
      ageMax?: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitAddPerformance",
      {
        accountId,
        adCategory: 1,
        ...adSetData,
      }
    );
    return response.data.data;
  }

  /**
   * Atualizar status de Ad Set(s)
   */
  async updateAdSetStatus(
    accountId: number,
    unitId: number | number[],
    openStatus: number
  ) {
    const unitIdList = Array.isArray(unitId) ? unitId : [unitId];

    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitUpdateOpenStatusPerformance",
      {
        accountId,
        unitIdList,
        openStatus, // 0=Off, 1=On
        adCategory: 1,
      }
    );
    return response.data;
  }

  // ========== MATERIAIS ==========

  /**
   * Listar materiais
   * Nota: Endpoint correto baseado na documentação
   */
  async getMaterials(
    accountId: number,
    params?: {
      pageNo?: number;
      pageSize?: number;
      materialType?: number; // 1=Video, 2=Image
    }
  ) {
    try {
      const response = await this.client.post(
        "/rest/n/mapi/material/dspMaterialQuery",
        {
          accountId,
          pageNo: params?.pageNo || 1,
          pageSize: params?.pageSize || 20,
          ...(params?.materialType && { materialType: params.materialType }),
        }
      );
      return response.data.data;
    } catch (error: any) {
      // Se 404, tentar endpoint alternativo
      if (error.response?.status === 404 || error.status === 404) {
        console.log("Tentando endpoint alternativo de materiais...");
        try {
          const response = await this.client.post(
            "/rest/n/mapi/material/dspVideoMaterialQuery",
            {
              accountId,
              pageNo: params?.pageNo || 1,
              pageSize: params?.pageSize || 20,
            }
          );
          return response.data.data;
        } catch (altError) {
          console.log("Endpoint alternativo também falhou");
          // Retornar vazio ao invés de erro
          return { data: [], total: 0 };
        }
      }
      throw error;
    }
  }

  /**
   * Upload de material (vídeo/imagem)
   * Nota: Para vídeos grandes, usar upload fragmentado
   */
  async uploadMaterial(
    accountId: number,
    materialData: {
      materialType: number; // 1=Video, 2=Image
      materialName: string;
      url: string; // URL do arquivo
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/material/dspMaterialAdd",
      {
        accountId,
        ...materialData,
      }
    );
    return response.data.data;
  }

  // ========== CRIATIVOS ==========

  /**
   * Listar criativos
   */
  async getCreatives(
    accountId: number,
    unitId: number,
    params?: {
      pageNo?: number;
      pageSize?: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/creative/dspCreativePageQueryPerformance",
      {
        accountId,
        unitId,
        adCategory: 1,
        pageNo: params?.pageNo || 1,
        pageSize: params?.pageSize || 20,
      }
    );
    return response.data.data;
  }

  /**
   * Criar criativo
   */
  async createCreative(
    accountId: number,
    creativeData: {
      unitId: number;
      creativeName: string;
      materialId: number;
      actionType: number; // 1=Learn More, 2=Download, etc
      actionUrl: string; // URL de destino
      description?: string;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/creative/dspCreativeAddPerformance",
      {
        accountId,
        adCategory: 1,
        ...creativeData,
      }
    );
    return response.data.data;
  }

  /**
   * Atualizar campanha
   */
  async updateCampaign(
    accountId: number,
    campaignId: number,
    updates: {
      campaignName?: string;
      campaignBudgetType?: number;
      campaignBudget?: number;
      openStatus?: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignUpdatePerformance",
      {
        accountId,
        campaignId,
        adCategory: 1,
        ...updates,
      }
    );
    return response.data.data;
  }

  /**
   * Atualizar Ad Set
   */
  async updateAdSet(
    accountId: number,
    unitId: number,
    updates: {
      unitName?: string;
      bid?: number;
      dayBudget?: number;
      websiteUrl?: string;
      openStatus?: number;
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitUpdatePerformance",
      {
        accountId,
        unitId,
        adCategory: 1,
        ...updates,
      }
    );
    return response.data.data;
  }

  /**
   * Buscar relatório de métricas
   */
  async getReport(
    accountId: number,
    params: {
      startDate: string;
      endDate: string;
      reportLevel: number; // 1=campaign, 2=adset, 3=ad
      metrics: string[];
    }
  ) {
    const response = await this.client.post(
      "/rest/n/mapi/report/dspReportQuery",
      {
        accountId,
        adCategory: 1,
        ...params,
      }
    );
    return response.data.data;
  }
}

export const kwaiAPI = new KwaiAPI();


