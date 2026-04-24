// Stubs for external dependencies referenced by WalletPage.
// The real repo presumably ships MUI-style `BoxProps`, a `useWalletBalances`
// hook, a `usePrices` hook, a `WalletRow` component, and a `classes` JSS-ish
// object. None of those are provided in the brief, so we stub enough shape
// here to typecheck the refactor.

import type { HTMLAttributes, ReactNode } from 'react';

export type BoxProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

export function useWalletBalances(): WalletBalance[] {
  return [];
}

export function usePrices(): Record<string, number> {
  return {};
}

export type WalletRowProps = {
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
};

export function WalletRow(_props: WalletRowProps): JSX.Element {
  return null as unknown as JSX.Element;
}

export const classes = { row: '' };
