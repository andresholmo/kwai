import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kwaiClient } from "@/lib/kwai/client";

// Hook para buscar contas
export function useAccounts(params: {
  agentId?: string;
  corpId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["accounts", params],
    queryFn: () => kwaiClient.getAccounts(params),
  });
}

// Hook para buscar campanhas
export function useCampaigns(params: {
  accountId: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["campaigns", params],
    queryFn: () => kwaiClient.getCampaigns(params),
  });
}

// Hook para criar campanha
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      accountId: string;
      campaignName: string;
      budget?: number;
      startDate?: string;
      endDate?: string;
      objective?: string;
    }) => kwaiClient.createCampaign(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

// Hook para buscar ad sets
export function useAdSets(params: {
  campaignId: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["adSets", params],
    queryFn: () => kwaiClient.getAdSets(params),
  });
}

// Hook para buscar criativos
export function useCreatives(params: {
  adSetId: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["creatives", params],
    queryFn: () => kwaiClient.getCreatives(params),
  });
}

// Hook para buscar relatórios
export function useReports(params: {
  accountId?: string;
  campaignId?: string;
  adSetId?: string;
  startDate: string;
  endDate: string;
  groupBy?: string[];
}) {
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => kwaiClient.getReports(params),
  });
}

