import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { getErrorMessage } from "@/utils/error";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error("[query] request failed", getErrorMessage(error));
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error("[mutation] request failed", getErrorMessage(error));
    },
  }),
});