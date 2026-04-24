import { useMemo } from 'react';
import {
  classes,
  useWalletBalances,
  usePrices,
  WalletRow,
  type BoxProps,
  type WalletBalance,
} from './stubs';

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

const PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const UNKNOWN_PRIORITY = -99;

function getPriority(blockchain: string): number {
  return PRIORITY[blockchain as Blockchain] ?? UNKNOWN_PRIORITY;
}

type DisplayBalance = WalletBalance & {
  priority: number;
  formatted: string;
  usdValue: number;
};

export function WalletPage(props: BoxProps): JSX.Element {
  const balances = useWalletBalances();
  const prices = usePrices();

  const rows = useMemo<DisplayBalance[]>(() => {
    return balances
      .map((b) => ({ ...b, priority: getPriority(b.blockchain) }))
      .filter((b) => b.priority > UNKNOWN_PRIORITY && b.amount > 0)
      .sort((a, b) => b.priority - a.priority)
      .map((b) => ({
        ...b,
        formatted: b.amount.toFixed(2),
        usdValue: (prices[b.currency] ?? 0) * b.amount,
      }));
  }, [balances, prices]);

  return (
    <div {...props}>
      {rows.map((row) => (
        <WalletRow
          key={`${row.blockchain}-${row.currency}`}
          className={classes.row}
          amount={row.amount}
          usdValue={row.usdValue}
          formattedAmount={row.formatted}
        />
      ))}
    </div>
  );
}
