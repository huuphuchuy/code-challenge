import { useQuery } from '@tanstack/react-query';
import { fetchPrices } from '@/lib/api';
import { toTokens } from '@/lib/tokens';

export function useTokenPrices() {
  return useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    select: toTokens,
    staleTime: 60_000,
  });
}
