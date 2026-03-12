import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { searchCommunityRecipes } from "../firebase/globalRecipeService";

const PAGE_SIZE = 30;

export function useGlobalRecipes(currentUserId) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["globalRecipes", currentUserId],
    queryFn: async ({ pageParam = null }) => {
      return searchCommunityRecipes({
        excludeUserId: currentUserId,
        sortBy: "avgRating",
        sortDirection: "desc",
        cursor: pageParam,
        pageSize: PAGE_SIZE,
      });
    },
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    enabled: !!currentUserId,
  });

  const allRecipes = useMemo(() => {
    if (!data?.pages) return [];
    const seen = new Set();
    return data.pages.flatMap((page) => page.recipes).filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [data]);

  return {
    allRecipes,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  };
}
