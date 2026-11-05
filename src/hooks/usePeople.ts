import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { BulkDuplicateStrategy, PeopleQuery, PersonRequest, UUID } from "@/api";
import { bulkUploadService, peopleService } from "@/services";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

import { queryKeys } from "./queryKeys";
import { useSafeMutation } from "./useSafeRequest";

const defaultPeopleParams: PeopleQuery = {
  page: 0,
  size: 100,
  sortBy: "name",
  direction: "ASC",
};

const PEOPLE_ENDPOINT = "/api/people";
const PEOPLE_BULK_UPLOAD_ENDPOINT = "/api/bulk/persons/upload";
const PEOPLE_TEMPLATE_ENDPOINT = "/api/bulk/persons/template";

export function usePeopleQuery(params: PeopleQuery = defaultPeopleParams) {
  return useQuery({
    queryKey: queryKeys.people.list(params),
    // The People/Assignments/Dashboard screens split this list client-side (e.g. by role),
    // so they need the whole directory, not just the first page. Fetch every page.
    queryFn: async () => {
      const firstPage = unwrapServiceResponse(await peopleService.getPeople(params));
      if (firstPage.totalPages <= 1) {
        return firstPage;
      }

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, async (_, index) =>
          unwrapServiceResponse(await peopleService.getPeople({ ...params, page: index + 1 })),
        ),
      );
      const items = [firstPage, ...remainingPages].flatMap((page) => page.items);

      return { ...firstPage, items, page: 0, size: items.length, totalPages: 1 };
    },
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });
}

export function useCreatePersonMutation() {
  const queryClient = useQueryClient();

  return useSafeMutation({
    getFingerprint: (payload: PersonRequest) => ({
      data: payload,
      method: "POST",
      url: PEOPLE_ENDPOINT,
    }),
    mutationFn: async (payload: PersonRequest) => unwrapServiceResponse(await peopleService.createPerson(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUpdatePersonMutation() {
  const queryClient = useQueryClient();

  return useSafeMutation({
    getFingerprint: ({ id, payload }: { id: UUID; payload: PersonRequest }) => ({
      data: payload,
      method: "PUT",
      resourceId: id,
      url: `${PEOPLE_ENDPOINT}/${id}`,
    }),
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

  return useSafeMutation({
    getFingerprint: (id: UUID) => ({
      method: "DELETE",
      resourceId: id,
      url: `${PEOPLE_ENDPOINT}/${id}`,
    }),
    mutationFn: async (id: UUID) => unwrapServiceResponse(await peopleService.deletePerson(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useUploadPeopleBulkMutation() {
  const queryClient = useQueryClient();

  return useSafeMutation({
    getFingerprint: ({ file, duplicateStrategy }: { file: File; duplicateStrategy: BulkDuplicateStrategy }) => ({
      data: { duplicateStrategy, file },
      method: "POST",
      params: { duplicateStrategy },
      url: PEOPLE_BULK_UPLOAD_ENDPOINT,
    }),
    mutationFn: async ({ file, duplicateStrategy }: { file: File; duplicateStrategy: BulkDuplicateStrategy }) =>
      unwrapServiceResponse(await bulkUploadService.uploadPersons(file, duplicateStrategy)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.people.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
    },
  });
}

export function useDownloadPeopleTemplateMutation() {
  return useSafeMutation({
    getFingerprint: () => ({
      method: "GET",
      url: PEOPLE_TEMPLATE_ENDPOINT,
    }),
    mutationFn: async () => unwrapServiceResponse(await bulkUploadService.downloadPersonsTemplate()),
  });
}