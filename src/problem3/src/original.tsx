// @ts-nocheck — this file is the original code from the brief, kept verbatim
// for reference. It is intentionally excluded from the tsconfig `include`
// list because several of its bugs would break compilation. The inline
// `// ISSUE #N` comments map 1-to-1 to the numbered list in README.md.
//
// DO NOT EDIT. This is the "before" snapshot. See `refactored.tsx` for the
// "after" version.

import React, { useMemo } from 'react';
import { useWalletBalances, usePrices, WalletRow, classes, BoxProps } from './stubs';

interface WalletBalance {
  currency: string;
  amount: number;
  // ISSUE #6: `blockchain` is read below but not declared here.
}
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

interface Props extends BoxProps {} // ISSUE #8: empty interface extending a type.

// ISSUE #9: `React.FC<Props>` AND `(props: Props)` — redundant typing;
// `React.FC` also implicitly adds `children` to the props contract.
const WalletPage: React.FC<Props> = (props: Props) => {
  // ISSUE #14: `children` is destructured but never used.
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // ISSUE #12: `getPriority` is redefined on every render (could live at
  // module scope). It also uses a `switch` where an O(1) lookup table would
  // be shorter, type-safe, and cheaper.
  // ISSUE #7: `blockchain: any` throws away type safety.
  const getPriority = (blockchain: any): number => {
    switch (blockchain) {
      case 'Osmosis':
        return 100;
      case 'Ethereum':
        return 50;
      case 'Arbitrum':
        return 30;
      case 'Zilliqa':
        return 20;
      case 'Neo':
        return 20;
      default:
        return -99;
    }
  };

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain);
        // ISSUE #1: `lhsPriority` is undefined — typo for `balancePriority`.
        //           Runtime ReferenceError / TS compile error.
        if (lhsPriority > -99) {
          // ISSUE #2: predicate is inverted — keeps zero/negative balances,
          //           drops positive ones. Reverse of what a wallet wants.
          if (balance.amount <= 0) {
            return true;
          }
        }
        return false;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        // ISSUE #12 (cont'd): `getPriority` is called 2–3× per balance
        //            (once in filter, twice per sort comparison).
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        if (leftPriority > rightPriority) {
          return -1;
        } else if (rightPriority > leftPriority) {
          return 1;
        }
        // ISSUE #3: no `return 0` for the equal case → undefined, non-
        //           deterministic sort order, fails strict TS.
      });
    // ISSUE #10: `prices` is in the dependency array but never read in the
    //            computation — causes unnecessary re-memoization every time
    //            prices update.
  }, [balances, prices]);

  // ISSUE #11: `formattedBalances` is computed outside `useMemo`, so a new
  //            array is allocated every render (children re-render unless
  //            `WalletRow` is memoized).
  // ISSUE #15: `.toFixed()` with no arg → 0 fraction digits → "42" instead
  //            of "42.50". Almost certainly unintended for currency.
  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed(),
    };
  });

  const rows = sortedBalances.map(
    // ISSUE #4: iterates `sortedBalances` (type `WalletBalance`) but
    //           annotates each item as `FormattedWalletBalance`. At runtime
    //           `balance.formatted` is `undefined`.
    // ISSUE #5: `formattedBalances` above was the intended source but is
    //           never read → dead code.
    (balance: FormattedWalletBalance, index: number) => {
      const usdValue = prices[balance.currency] * balance.amount;
      return (
        <WalletRow
          className={classes.row}
          // ISSUE #13: `key={index}` is an anti-pattern when the list can
          //            be reordered/filtered — React may misattribute DOM
          //            nodes. Use a stable key (e.g. currency + blockchain).
          key={index}
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    },
  );

  return <div {...rest}>{rows}</div>;
};
