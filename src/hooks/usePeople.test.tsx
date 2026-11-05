import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSuccessResponse } from "@/api/utils/serviceResponse";

import { usePeopleQuery } from "./usePeople";

const services = vi.hoisted(() => ({
  bulkUploadService: {},
  peopleService: {
    getPeople: vi.fn(),
  },
}));

vi.mock("@/services", () => services);

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function person(index: number, role: "CHIEF_INVIGILATOR" | "INVIGILATOR") {
  return { id: `person-${index}`, name: `Person ${String(index).padStart(3, "0")}`, role };
}

describe("usePeopleQuery", () => {
  beforeEach(() => {
    services.peopleService.getPeople.mockReset();
  });

  it("loads every page so people beyond the first 100 are not dropped", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => person(index, "INVIGILATOR"));
    const secondPage = [person(100, "CHIEF_INVIGILATOR"), person(101, "CHIEF_INVIGILATOR")];

    services.peopleService.getPeople.mockImplementation(async (params: { page?: number }) => {
      const items = params.page === 1 ? secondPage : firstPage;
      return createSuccessResponse({ items, page: params.page ?? 0, size: 100, totalItems: 102, totalPages: 2 });
    });

    const { result } = renderHook(() => usePeopleQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(services.peopleService.getPeople).toHaveBeenCalledTimes(2);
    expect(services.peopleService.getPeople).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 100 }));
    expect(result.current.data?.items).toHaveLength(102);
    expect(result.current.data?.items.filter((item) => item.role === "CHIEF_INVIGILATOR")).toHaveLength(2);
  });

  it("makes a single request when everything fits on one page", async () => {
    services.peopleService.getPeople.mockResolvedValue(
      createSuccessResponse({ items: [person(1, "CHIEF_INVIGILATOR")], page: 0, size: 100, totalItems: 1, totalPages: 1 }),
    );

    const { result } = renderHook(() => usePeopleQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(services.peopleService.getPeople).toHaveBeenCalledTimes(1);
    expect(result.current.data?.items).toHaveLength(1);
  });
});
