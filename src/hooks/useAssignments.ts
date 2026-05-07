import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { AssignmentRequest, AssignmentsQuery, UUID } from "@/api";
import { assignmentsService } from "@/services";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

import { queryKeys } from "./queryKeys";
import { useSafeMutation } from "./useSafeRequest";

const defaultAssignmentsParams: AssignmentsQuery = {
  page: 0,
  size: 100,
  sortBy: "examDate",
  direction: "ASC",
};

const ASSIGNMENTS_ENDPOINT = "/api/assignments";

export function useAssignmentsQuery(params: AssignmentsQuery = defaultAssignmentsParams) {
  return useQuery({
    queryKey: queryKeys.assignments.list(params),
    queryFn: async () => unwrapServiceResponse(await assignmentsService.getAssignments(params)),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
}

export function useCreateAssignmentMutation() {
  const queryClient = useQueryClient();

  return useSafeMutation({
    getFingerprint: (payload: AssignmentRequest) => ({
      data: payload,
      method: "POST",
      url: ASSIGNMENTS_ENDPOINT,
    }),
    mutationFn: async (payload: AssignmentRequest) =>
      unwrapServiceResponse(await assignmentsService.createAssignment(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
    },
  });
}

export function useUpdateAssignmentMutation() {
  const queryClient = useQueryClient();

  return useSafeMutation({
    getFingerprint: ({ id, payload }: { id: UUID; payload: AssignmentRequest }) => ({
      data: payload,
      method: "PUT",
      resourceId: id,
      url: `${ASSIGNMENTS_ENDPOINT}/${id}`,
    }),
    mutationFn: async ({ id, payload }: { id: UUID; payload: AssignmentRequest }) =>
      unwrapServiceResponse(await assignmentsService.updateAssignment(id, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
    },
  });
}

export function useDeleteAssignmentMutation() {
  const queryClient = useQueryClient();

  return useSafeMutation({
    getFingerprint: (id: UUID) => ({
      method: "DELETE",
      resourceId: id,
      url: `${ASSIGNMENTS_ENDPOINT}/${id}`,
    }),
    mutationFn: async (id: UUID) => unwrapServiceResponse(await assignmentsService.deleteAssignment(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
    },
  });
}