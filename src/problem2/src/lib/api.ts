import type { Price } from '@/types';

const PRICES_URL = 'https://interview.switcheo.com/prices.json';

export async function fetchPrices(): Promise<Price[]> {
  const res = await fetch(PRICES_URL);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
  return res.json();
}
