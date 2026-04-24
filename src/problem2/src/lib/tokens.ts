import type { Price, Token } from '@/types';

const ICON_BASE =
  'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

export function iconUrl(symbol: string): string {
  return `${ICON_BASE}/${symbol}.svg`;
}

export function toTokens(prices: Price[]): Token[] {
  const latest = new Map<string, Price>();
  for (const p of prices) {
    if (typeof p.price !== 'number' || p.price <= 0) continue;
    const existing = latest.get(p.currency);
    if (!existing || new Date(p.date) > new Date(existing.date)) {
      latest.set(p.currency, p);
    }
  }
  return Array.from(latest.values())
    .map((p) => ({
      symbol: p.currency,
      price: p.price,
      iconUrl: iconUrl(p.currency),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function calcExchange(
  amount: number,
  fromPrice: number,
  toPrice: number,
): number {
  if (!amount || !fromPrice || !toPrice) return 0;
  return (amount * fromPrice) / toPrice;
}

export function formatAmount(n: number, maxDecimals = 6): string {
  if (!isFinite(n) || n === 0) return '0';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4).replace(/\.?0+$/, '');
  return n.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

export function formatPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(4)}`;
}
