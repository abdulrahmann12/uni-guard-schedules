import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SettingsRequest } from "@/api";
import { settingsService } from "@/services";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

import { queryKeys } from "./queryKeys";

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: async () => unwrapServiceResponse(await settingsService.getSettings()),
    refetchOnWindowFocus: true,
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SettingsRequest) => unwrapServiceResponse(await settingsService.updateSettings(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });
}