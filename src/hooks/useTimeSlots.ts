import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { TimeSlotRequest, TimeSlotsQuery, UUID } from "@/api";
import { timeSlotsService } from "@/services";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

import { queryKeys } from "./queryKeys";

const defaultTimeSlotParams: TimeSlotsQuery = {
  page: 0,
  size: 100,
  sortBy: "sortOrder",
  direction: "ASC",
};

export function useTimeSlotsQuery(params: TimeSlotsQuery = defaultTimeSlotParams) {
  return useQuery({
    queryKey: queryKeys.timeSlots.list(params),
    queryFn: async () => unwrapServiceResponse(await timeSlotsService.getTimeSlots(params)),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTimeSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TimeSlotRequest) =>
      unwrapServiceResponse(await timeSlotsService.createTimeSlot(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUpdateTimeSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: UUID; payload: TimeSlotRequest }) =>
      unwrapServiceResponse(await timeSlotsService.updateTimeSlot(id, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDeactivateTimeSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: UUID) => unwrapServiceResponse(await timeSlotsService.deactivateTimeSlot(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDeleteTimeSlotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: UUID) => unwrapServiceResponse(await timeSlotsService.deleteTimeSlot(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.timeSlots.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}