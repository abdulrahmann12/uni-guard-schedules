import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BulkDuplicateStrategy, PeopleQuery, PersonRequest, UUID } from "@/api";
import { bulkUploadService, peopleService } from "@/services";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

import { queryKeys } from "./queryKeys";

const defaultPeopleParams: PeopleQuery = {
  page: 0,
  size: 100,
  sortBy: "name",
  direction: "ASC",
};

export function usePeopleQuery(params: PeopleQuery = defaultPeopleParams) {
  return useQuery({
    queryKey: queryKeys.people.list(params),
    queryFn: async () => unwrapServiceResponse(await peopleService.getPeople(params)),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
}

export function useCreatePersonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PersonRequest) => unwrapServiceResponse(await peopleService.createPerson(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUpdatePersonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: UUID; payload: PersonRequest }) =>
      unwrapServiceResponse(await peopleService.updatePerson(id, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDeletePersonMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: UUID) => unwrapServiceResponse(await peopleService.deletePerson(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUploadPeopleBulkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, duplicateStrategy }: { file: File; duplicateStrategy: BulkDuplicateStrategy }) =>
      unwrapServiceResponse(await bulkUploadService.uploadPersons(file, duplicateStrategy)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDownloadPeopleTemplateMutation() {
  return useMutation({
    mutationFn: async () => unwrapServiceResponse(await bulkUploadService.downloadPersonsTemplate()),
  });
}