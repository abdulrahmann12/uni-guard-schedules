import type { NormalizedPaginatedResponse, ServiceResponse } from "@/api";
import { unwrapServiceResponse } from "@/utils/serviceResponse";

/**
 * Loads every page of a paginated list and returns it as a single page.
 *
 * Screens such as People, Rooms and the Dashboard filter and count these lists
 * client-side, so they need the whole collection, not just the first page.
 */
export async function fetchAllPages<TItem, TParams extends { page?: number }>(
  fetchPage: (params: TParams) => Promise<ServiceResponse<NormalizedPaginatedResponse<TItem>>>,
  params: TParams,
): Promise<NormalizedPaginatedResponse<TItem>> {
  const firstPage = unwrapServiceResponse(await fetchPage({ ...params, page: 0 }));
  if (firstPage.totalPages <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, async (_, index) =>
      unwrapServiceResponse(await fetchPage({ ...params, page: index + 1 })),
    ),
  );
  const items = [firstPage, ...remainingPages].flatMap((page) => page.items);

  return { ...firstPage, items, page: 0, size: items.length, totalItems: items.length, totalPages: 1 };
}
