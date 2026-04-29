import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BulkDuplicateStrategy, RoomRequest, RoomsQuery, UUID } from "@/api";
import { bulkUploadService, roomsService } from "@/services";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

import { queryKeys } from "./queryKeys";

const defaultRoomsParams: RoomsQuery = {
  page: 0,
  size: 100,
  sortBy: "name",
  direction: "ASC",
};

export function useRoomsQuery(params: RoomsQuery = defaultRoomsParams) {
  return useQuery({
    queryKey: queryKeys.rooms.list(params),
    queryFn: async () => unwrapServiceResponse(await roomsService.getRooms(params)),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RoomRequest) => unwrapServiceResponse(await roomsService.createRoom(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUpdateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: UUID; payload: RoomRequest }) =>
      unwrapServiceResponse(await roomsService.updateRoom(id, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDeleteRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: UUID) => unwrapServiceResponse(await roomsService.deleteRoom(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUploadRoomsBulkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, duplicateStrategy }: { file: File; duplicateStrategy: BulkDuplicateStrategy }) =>
      unwrapServiceResponse(await bulkUploadService.uploadRooms(file, duplicateStrategy)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDownloadRoomsTemplateMutation() {
  return useMutation({
    mutationFn: async () => unwrapServiceResponse(await bulkUploadService.downloadRoomsTemplate()),
  });
}