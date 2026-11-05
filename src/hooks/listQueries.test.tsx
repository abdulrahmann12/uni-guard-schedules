import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSuccessResponse } from "@/api/utils/serviceResponse";

import { useRoomsQuery } from "./useRooms";
import { useTimeSlotsQuery } from "./useTimeSlots";

const services = vi.hoisted(() => ({
  bulkUploadService: {},
  roomsService: { getRooms: vi.fn() },
  timeSlotsService: { getTimeSlots: vi.fn() },
}));

vi.mock("@/services", () => services);

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/** Fake backend: `total` items served in pages of `params.size`. */
function pagedBackend(total: number) {
  return async (params: { page?: number; size?: number }) => {
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const items = Array.from({ length: total }, (_, index) => ({ id: `item-${index}` })).slice(page * size, (page + 1) * size);
    return createSuccessResponse({ items, page, size, totalItems: total, totalPages: Math.ceil(total / size) });
  };
}

describe("list queries load every page", () => {
  beforeEach(() => {
    services.roomsService.getRooms.mockReset();
    services.timeSlotsService.getTimeSlots.mockReset();
  });

  it("returns all rooms when there are more than 100", async () => {
    services.roomsService.getRooms.mockImplementation(pagedBackend(230));

    const { result } = renderHook(() => useRoomsQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(services.roomsService.getRooms).toHaveBeenCalledTimes(3);
    expect(result.current.data?.items).toHaveLength(230);
    expect(new Set(result.current.data?.items.map((room) => room.id)).size).toBe(230);
  });

  it("returns all time slots even when the caller asks for a small page size", async () => {
    services.timeSlotsService.getTimeSlots.mockImplementation(pagedBackend(25));

    const { result } = renderHook(
      () => useTimeSlotsQuery({ page: 0, size: 20, sortBy: "sortOrder", direction: "ASC", activeOnly: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(services.timeSlotsService.getTimeSlots).toHaveBeenLastCalledWith(expect.objectContaining({ activeOnly: true, page: 1 }));
    expect(result.current.data?.items).toHaveLength(25);
  });
});
