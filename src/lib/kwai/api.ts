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
      baseURL: process.env.KWAI_API_BASE_URL || "https://developers.kwai.com",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log("=== AXIOS REQUEST INTERCEPTOR ===");
        console.log("URL:", config.url);
        console.log("Method:", config.method);
        console.log("Base URL:", config.baseURL);
        console.log("Full URL:", `${config.baseURL}${config.url}`);
        console.log("Headers:", JSON.stringify(config.headers, null, 2));
        console.log("Data:", JSON.stringify(config.data, null, 2));
        console.log("=================================");

        if (this.accessToken) {
          config.headers["Access-Token"] = this.accessToken;
          console.log("Access-Token added to headers");
        } else {
          console.warn("WARNING: No access token set!");
        }

        return config;
      },
      (error) => {
        console.error("=== REQUEST INTERCEPTOR ERROR ===");
        console.error("Error:", error);
        console.error("=================================");
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log("=== AXIOS RESPONSE INTERCEPTOR ===");
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        console.log("Data:", JSON.stringify(response.data, null, 2));

        // IMPORTANTE: Kwai retorna HTTP 200 mas com erro embutido no data.status
        if (response.data?.status && response.data.status !== 200) {
          console.error(
            "API returned error in response.data.status:",
            response.data.status
          );
          console.log("==================================");

          // Criar erro com a mesma estrutura que axios usaria
          const error: any = new Error(
            response.data.message || "API Error"
          );
          error.response = {
            status: response.data.status,
            data: response.data,
            statusText: response.data.message,
            headers: response.headers,
            config: response.config,
          };
          error.config = response.config;
          error.request = response.request;

          return Promise.reject(error);
        }

        console.log("==================================");
        return response;
      },
      (error: AxiosError<any>) => {
        console.error("=== RESPONSE INTERCEPTOR ERROR ===");
        console.error("Has response:", !!error.response);
        console.error("Status:", error.response?.status);
        console.error("Status Text:", error.response?.statusText);
        console.error("Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Config:", JSON.stringify(
          {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            data: error.config?.data,
            headers: error.config?.headers,
          },
          null,
          2
        ));
        console.error("===================================");

        const originalRequest = error.config as any;

        // Token expirado (401) - tentar refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          console.error("Token expired - needs manual refresh");
        }

        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    console.log("=== SETTING ACCESS TOKEN ===");
    console.log("Token (first 20 chars):", token.substring(0, 20));
    console.log("Token length:", token.length);
    console.log("============================");
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
  async createCampaign(accountId: number, campaignData: any) {
    console.log("=== CREATE CAMPAIGN INPUT ===");
    console.log("campaignData:", JSON.stringify(campaignData, null, 2));

    // REGRA CRÍTICA: Se deliveryStrategy = 3 (LC/Lowest Cost)
    // budgetType DEVE ser 1 e NÃO pode ter budget
    const isLCStrategy = campaignData.deliveryStrategy === 3;

    if (isLCStrategy) {
      console.log(
        "⚠️ LC STRATEGY DETECTED - Forcing budgetType=1, removing budget"
      );
    }

    // Determinar budgetType
    const budgetType = isLCStrategy
      ? 1
      : campaignData.budgetType || campaignData.campaignBudgetType || 1;

    // Construir objeto da campanha
    const campaignObject: any = {
      campaignName: campaignData.campaignName,
      marketingGoal: campaignData.marketingGoal || 3,
      objective: campaignData.objective || 2,
      adCategory: campaignData.adCategory || 1,
      campaignType: campaignData.campaignType || 3,
      budgetType: budgetType,
      marketingType: campaignData.marketingType || 1,
      deliveryStrategy: campaignData.deliveryStrategy || 3,
      conversionType: campaignData.conversionType || 1,
      budgetOptimization: 0, // Sempre 0 na criação
    };

    // IMPORTANTE: Só adicionar budget se NÃO for LC strategy E budgetType != 1
    if (!isLCStrategy && budgetType !== 1) {
      const budgetValue =
        campaignData.budget ||
        campaignData.campaignBudget ||
        campaignData.dayBudget;
      if (budgetValue && budgetValue > 0) {
        campaignObject.budget = budgetValue;
        console.log("Adding budget:", budgetValue);
      }
    } else {
      console.log("NOT adding budget (LC strategy or budgetType=1)");
    }

    const payload = {
      accountId,
      campaignAddModelList: [campaignObject],
    };

    console.log("=== FINAL CAMPAIGN PAYLOAD ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("==============================");

    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignAddPerformance",
      payload
    );

    console.log("=== CREATE CAMPAIGN RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    // Extrair campaignId da estrutura correta: response.data.data[0].campaignId
    const campaignId =
      response.data?.data?.data?.[0]?.campaignId ||
      response.data?.data?.[0]?.campaignId ||
      response.data?.campaignId;

    console.log("Extracted campaignId:", campaignId);

    if (!campaignId) {
      console.error("Could not extract campaignId from response");
      console.error("Response structure:", JSON.stringify(response.data, null, 2));
    }

    // Retornar com campaignId no nível superior para facilitar
    return {
      ...response.data,
      campaignId: campaignId,
    };
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
    campaignId?: number,
    params?: {
      pageNo?: number;
      pageSize?: number;
    }
  ) {
    console.log("=== kwaiAPI.getAdSets ===");
    console.log("accountId:", accountId);
    console.log("campaignId:", campaignId);

    const payload: any = {
      accountId,
      pageNo: params?.pageNo || 1,
      pageSize: params?.pageSize || 100,
      adCategory: 1,
    };

    // IMPORTANTE: Se campaignId foi passado, adicionar ao payload
    if (campaignId) {
      payload.campaignId = campaignId;
      console.log("Adding campaignId to payload:", campaignId);
    } else {
      console.log("NO campaignId - will return ALL ad sets");
    }

    console.log("Final payload:", JSON.stringify(payload, null, 2));

    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitPageQueryPerformance",
      payload
    );

    console.log("Response total:", response.data.data?.total || 0);
    console.log("Response items:", response.data.data?.data?.length || 0);

    return response.data.data;
  }

  /**
   * Criar Ad Set
   */
  async createAdSet(accountId: number, adSetData: any) {
    console.log("=== CREATE AD SET INPUT ===");
    console.log("adSetData:", JSON.stringify(adSetData, null, 2));

    // Construir objeto do unit (ad set)
    // IMPORTANTE: adCategory deve estar DENTRO do objeto unit, não no nível raiz
    const unitObject: any = {
      adCategory: 1, // <-- OBRIGATÓRIO dentro de cada unit
      campaignId: adSetData.campaignId,
      unitName: adSetData.unitName || adSetData.name,
      websiteUrl: adSetData.websiteUrl || adSetData.destinationUrl,
      optimizeTarget: adSetData.optimizeTarget || adSetData.optimizationGoal || 1,
      bidType: adSetData.bidType || 1,
      bid: adSetData.bid || 100000, // Mínimo 0.001 = 100000 micro
      scheduleStartTime:
        adSetData.scheduleStartTime || this.formatDate(new Date()),
    };

    // Adicionar campos opcionais
    if (adSetData.gender !== undefined) {
      unitObject.gender = adSetData.gender;
    }

    if (adSetData.region && adSetData.region.length > 0) {
      unitObject.region = adSetData.region;
    }

    if (adSetData.ageMin) {
      unitObject.ageMin = adSetData.ageMin;
    }

    if (adSetData.ageMax) {
      unitObject.ageMax = adSetData.ageMax;
    }

    // Orçamento do Ad Set (se definido)
    if (adSetData.dayBudget && adSetData.dayBudget > 0) {
      unitObject.budgetType = 2; // Orçamento diário
      unitObject.dayBudget = adSetData.dayBudget;
    } else if (adSetData.unitBudget && adSetData.unitBudget > 0) {
      unitObject.budgetType = 2;
      unitObject.dayBudget = adSetData.unitBudget;
    } else if (adSetData.budget && adSetData.budget > 0) {
      unitObject.budgetType = 2;
      unitObject.dayBudget = adSetData.budget;
    }

    // CORREÇÃO: Payload SEM adCategory no nível raiz
    // A API não aceita adCategory no nível raiz para este endpoint
    const payload = {
      accountId,
      // adCategory REMOVIDO - não é aceito neste endpoint
      unitAddModelList: [unitObject], // <-- ARRAY com o unit object
    };

    console.log("=== FINAL AD SET PAYLOAD ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("============================");

    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitAddPerformance",
      payload
    );

    console.log("=== CREATE AD SET RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    // Extrair unitId da resposta
    const unitId =
      response.data?.data?.data?.[0]?.unitId ||
      response.data?.data?.[0]?.unitId ||
      response.data?.unitId;

    console.log("Extracted unitId:", unitId);

    return {
      ...response.data,
      unitId: unitId,
    };
  }

  /**
   * Helper para formatar data
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day} 00:00:00`;
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
    unitId?: number,
    params?: {
      pageNo?: number;
      pageSize?: number;
    }
  ) {
    console.log("=== kwaiAPI.getCreatives ===");
    console.log("accountId:", accountId);
    console.log("unitId:", unitId);

    const payload: any = {
      accountId,
      pageNo: params?.pageNo || 1,
      pageSize: params?.pageSize || 100,
      adCategory: 1,
    };

    // IMPORTANTE: Se unitId foi passado, adicionar ao payload
    if (unitId) {
      payload.unitId = unitId;
      console.log("Adding unitId to payload:", unitId);
    } else {
      console.log("NO unitId - will return ALL creatives");
    }

    console.log("Final payload:", JSON.stringify(payload, null, 2));

    const response = await this.client.post(
      "/rest/n/mapi/creative/dspCreativePageQueryPerformance",
      payload
    );

    console.log("Response total:", response.data.data?.total || 0);
    console.log("Response items:", response.data.data?.data?.length || 0);

    return response.data.data;
  }

  /**
   * Criar criativo
   */
  async createCreative(accountId: number, creativeData: any) {
    console.log("=== CREATE CREATIVE INPUT ===");
    console.log("creativeData:", JSON.stringify(creativeData, null, 2));

    // Construir objeto do criativo
    const creativeObject: any = {
      unitId: creativeData.unitId,
      creativeName: creativeData.creativeName || creativeData.name,
      actionType: creativeData.actionType || 1,
      actionUrl: creativeData.actionUrl || creativeData.destinationUrl || creativeData.clickUrl,
      ...(creativeData.description && { desc: creativeData.description }),
    };

    // Adicionar photoId se selecionado (preferido)
    if (creativeData.photoId) {
      creativeObject.photoId = creativeData.photoId;
    } else if (creativeData.materialId) {
      // Fallback para materialId (compatibilidade)
      creativeObject.materialId = creativeData.materialId;
    }

    // Payload com estrutura correta - creativeAddModelList é um ARRAY
    const payload = {
      accountId,
      adCategory: creativeData.adCategory || 1,
      creativeAddModelList: [creativeObject], // <-- ARRAY
    };

    console.log("=== FINAL CREATIVE PAYLOAD ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("=============================");

    const response = await this.client.post(
      "/rest/n/mapi/creative/dspCreativeAddPerformance",
      payload
    );

    console.log("=== CREATE CREATIVE RESPONSE ===");
    console.log(JSON.stringify(response.data, null, 2));

    // Extrair creativeId da estrutura correta: response.data.data[0].creativeId
    const creativeId =
      response.data?.data?.data?.[0]?.creativeId ||
      response.data?.data?.[0]?.creativeId ||
      response.data?.creativeId;

    console.log("Extracted creativeId:", creativeId);

    // Retornar com creativeId no nível superior para facilitar
    return {
      ...response.data,
      creativeId: creativeId,
    };
  }

  /**
   * Atualizar campanha
   */
  async updateCampaign(accountId: number, campaignData: any) {
    // Converter openStatus se necessário
    const openStatus =
      campaignData.openStatus === 0 || campaignData.openStatus === false
        ? 2
        : campaignData.openStatus === 1 || campaignData.openStatus === true
          ? 1
          : campaignData.openStatus;

    // Determinar budgetType
    const budgetType =
      campaignData.budgetType ||
      (campaignData.dayBudget && campaignData.dayBudget > 0 ? 2 : 1);

    const payload = {
      accountId,
      campaignUpdateModelList: [
        {
          campaignId: campaignData.campaignId,
          ...(campaignData.campaignName && {
            campaignName: campaignData.campaignName,
          }),
          ...(openStatus !== undefined && { openStatus: openStatus }),
          budgetType: budgetType,
          ...(campaignData.dayBudget !== undefined && {
            dayBudget: campaignData.dayBudget || 0,
          }),
        },
      ],
      adCategory: 1,
    };

    console.log("=== UPDATE CAMPAIGN ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("======================");

    const response = await this.client.post(
      "/rest/n/mapi/campaign/dspCampaignUpdatePerformance",
      payload
    );
    return response.data;
  }

  /**
   * Atualizar Ad Set
   */
  async updateAdSet(accountId: number, adSetData: any) {
    // Converter openStatus se necessário
    const openStatus =
      adSetData.openStatus === 0 || adSetData.openStatus === false
        ? 2
        : adSetData.openStatus === 1 || adSetData.openStatus === true
          ? 1
          : adSetData.openStatus;

    // IMPORTANTE: budgetType é obrigatório!
    const budgetType =
      adSetData.budgetType ||
      (adSetData.dayBudget && adSetData.dayBudget > 0 ? 2 : 1);

    const payload = {
      accountId,
      unitUpdateModelList: [
        {
          unitId: adSetData.unitId,
          ...(adSetData.unitName && { unitName: adSetData.unitName }),
          ...(openStatus !== undefined && { openStatus: openStatus }),
          budgetType: budgetType,
          ...(adSetData.dayBudget !== undefined && {
            dayBudget: adSetData.dayBudget || 0,
          }),
          ...(adSetData.bid !== undefined && { bid: adSetData.bid }),
          ...(adSetData.websiteUrl !== undefined && {
            websiteUrl: adSetData.websiteUrl,
          }),
        },
      ],
      adCategory: 1,
    };

    console.log("=== UPDATE AD SET ===");
    console.log(JSON.stringify(payload, null, 2));
    console.log("====================");

    const response = await this.client.post(
      "/rest/n/mapi/unit/dspUnitUpdatePerformance",
      payload
    );
    return response.data;
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

  /**
   * Buscar metas de conversão disponíveis
   */
  async getConversions(accountId: number, marketingType: number = 2) {
    console.log("=== GET CONVERSIONS ===");
    console.log("accountId:", accountId);
    console.log("marketingType:", marketingType);

    try {
      // Endpoint para listar metas de conversão disponíveis
      const response = await this.client.post("/rest/n/mapi/tool/dspConvertList", {
        accountId,
        marketingType, // 1 = App, 2 = Website
      });

      console.log("Conversions response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching conversions:", error.message);
      return { data: [], total: 0 };
    }
  }

  /**
   * Buscar pixels de conversão (deprecated - usar getConversions)
   */
  async getPixels(accountId: number) {
    try {
      // Tentar endpoint padrão do Kwai Ads
      const payload = {
        accountId,
        pageNo: 1,
        pageSize: 100,
      };

      console.log("=== GET PIXELS ===");
      console.log("Trying endpoint: /rest/n/mapi/pixel/dspPixelPageQueryPerformance");

      const response = await this.client.post(
        "/rest/n/mapi/pixel/dspPixelPageQueryPerformance",
        payload
      );

      console.log("Pixels response:", response.data);
      return response.data.data;
    } catch (error: any) {
      console.error("Erro ao buscar pixels:", error.message);

      // Se falhar, retornar array vazio ao invés de erro
      // O usuário pode não ter pixels configurados
      return { data: [], total: 0 };
    }
  }

  /**
   * Método auxiliar para fazer chamadas diretas (para testes)
   */
  async post(endpoint: string, data: any) {
    return await this.client.post(endpoint, data);
  }
}

export const kwaiAPI = new KwaiAPI();


