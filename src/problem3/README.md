# Problem 3 — Messy React

A code review of the `WalletPage` component from the brief, plus a
refactored version that fixes every issue.

The brief awards **more points for accurately stating issues and explaining
how to fix them** than for the rewrite itself, so the bulk of this document
is the analysis. The refactor is in [`src/refactored.tsx`](src/refactored.tsx).

## Contents

| File | Purpose |
| ---- | ------- |
| [`src/original.tsx`](src/original.tsx) | Original code, verbatim. Each problem is annotated inline with `// ISSUE #N` markers that map 1-to-1 to the numbered list below. Excluded from `tsc` because some issues would break compilation. |
| [`src/refactored.tsx`](src/refactored.tsx) | Clean rewrite. Passes `tsc --noEmit` under `strict` + `noUnusedLocals`. |
| [`src/stubs.ts`](src/stubs.ts) | Local stubs for `BoxProps`, `useWalletBalances`, `usePrices`, `WalletRow`, and `classes` — the brief references them but never supplies them. Enough shape to typecheck the refactor. |
| [`tsconfig.json`](tsconfig.json) | `strict` TypeScript config. `npm run typecheck` passes. |

## Quick start

```bash
npm install
npm run typecheck   # tsc --noEmit, no errors
```

## Summary

**15 distinct problems** across three groups:

| Group | Count | Effect |
| ----- | ----- | ------ |
| 🔴 Logic bugs | 6 | Runtime crash, inverted behaviour, or wrong rendered output. |
| 🟡 Typing issues | 3 | Weaken TypeScript guarantees; some fail `strict`. |
| 🟢 Performance / React anti-patterns | 6 | Redundant work every render, or unstable keys. |

### Issue map

| # | Group | One-liner | Fix |
| - | ----- | --------- | --- |
| 1 | 🔴 | `lhsPriority` is undefined (typo for `balancePriority`) | Use the variable that actually exists, or better, hoist it. |
| 2 | 🔴 | Filter predicate keeps `amount <= 0` balances and drops positive ones | Invert: `amount > 0`. |
| 3 | 🔴 | Sort comparator has no `return 0` for the equal case | Return a number on every path (`b.priority - a.priority` handles all three cases). |
| 4 | 🔴 | `rows.map` annotates each item as `FormattedWalletBalance` but iterates `sortedBalances` (which lacks `formatted`) | Map over the already-formatted array. |
| 5 | 🔴 | `formattedBalances` is computed but never read (consequence of #4) | Fold the formatting into the memoized pipeline and use its result. |
| 6 | 🔴 | `WalletBalance` is missing `blockchain`, which the code accesses | Add `blockchain: string` (or a narrower union) to the interface. |
| 7 | 🟡 | `getPriority(blockchain: any)` | Use a `Record<Blockchain, number>` lookup; param type `string`. |
| 8 | 🟡 | `interface Props extends BoxProps {}` — empty interface | `type Props = BoxProps`, or just use `BoxProps` directly. |
| 9 | 🟡 | `const WalletPage: React.FC<Props> = (props: Props) =>` — double-typed, and `React.FC` implicitly adds `children` | Plain function: `function WalletPage(props: BoxProps)`. |
| 10 | 🟢 | `useMemo` deps include `prices` but the callback never reads it | Remove `prices`, or if formatting depends on it, move that work inside the memo (chosen fix). |
| 11 | 🟢 | `formattedBalances` is recomputed outside any memo → new array every render | Fold it into the `useMemo`. |
| 12 | 🟢 | `getPriority` is called 2–3× per balance (filter + both sides of every sort comparison) | Compute once, attach to each balance, then filter/sort over the cached value. |
| 13 | 🟢 | `key={index}` on a list that is filtered and sorted | Use a stable composite key (`blockchain-currency`). |
| 14 | 🟢 | `const { children, ...rest } = props` — `children` is never rendered | Drop the destructure, spread `props` directly. |
| 15 | 🟢 | `.toFixed()` with no argument → 0 fraction digits (`"42"` for currency) | Pick a sensible precision for the domain (`toFixed(2)` here). |

---

## Full explanations

### 🔴 Logic bugs

#### #1 · `lhsPriority` is undefined

```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) { … }
```

`lhsPriority` is never declared in this scope. It's a copy-paste leftover
from the sort comparator below (which uses `leftPriority`/`rightPriority`
— note: still not `lhsPriority`). Under `strict` this fails to compile;
under a looser setup it would throw a `ReferenceError` at runtime the
moment the filter runs.

**Fix:** reference `balancePriority`, or — preferred — compute priority
once and pass the cached value through (see #12).

#### #2 · Inverted filter predicate

```ts
if (balancePriority > -99) {
  if (balance.amount <= 0) {
    return true;     // keeps empty/negative balances
  }
}
return false;        // drops everything else, including positives
```

This keeps exactly the rows you don't want (empty / negative) and discards
the ones you do (positive). A wallet UI should almost certainly render
positive balances.

**Fix:** `priority > UNKNOWN_PRIORITY && amount > 0`, as a single boolean.

#### #3 · Sort comparator misses the equal case

```ts
.sort((lhs, rhs) => {
  …
  if (leftPriority > rightPriority) return -1;
  else if (rightPriority > leftPriority) return 1;
  // implicit undefined when equal
})
```

`Array.prototype.sort` requires the comparator to return a number; when it
returns `undefined` the ordering is implementation-defined and the two
elements may shuffle unpredictably. Under `strict` + `noImplicitReturns`
this won't even compile.

**Fix:** subtract priorities instead — `(a, b) => b.priority - a.priority`
— which is both shorter and always returns a number, including `0` for
ties.

#### #4 · `rows` maps the wrong array

```ts
const rows = sortedBalances.map(
  (balance: FormattedWalletBalance, index: number) => {
    …
    formattedAmount={balance.formatted}   // undefined at runtime
  },
);
```

The author annotated the callback param as `FormattedWalletBalance` — but
the array being iterated is `sortedBalances` (plain `WalletBalance[]`),
which has no `formatted` property. Annotating a value doesn't change it;
TypeScript would normally catch the mismatch, but here the author used a
named annotation that happened to be assignable, so the bug slipped
through. `balance.formatted` renders as `undefined`.

**Fix:** iterate the formatted array (after folding it into the memo — see
#5 and #11).

#### #5 · `formattedBalances` is dead code

```ts
const formattedBalances = sortedBalances.map(b => ({ ...b, formatted: b.amount.toFixed() }));

const rows = sortedBalances.map(…);  // ← note: sortedBalances, not formattedBalances
```

The whole point of `formattedBalances` is to feed `rows`, but `rows` maps
`sortedBalances` instead. The result: the formatting work runs every
render and is then thrown away, and `rows` ends up with `undefined`
formatted amounts (see #4).

**Fix:** use a single memoized pipeline that ends with the fully-formatted
rows, then iterate that one array for the JSX.

#### #6 · `WalletBalance` is missing `blockchain`

```ts
interface WalletBalance {
  currency: string;
  amount: number;
  // no `blockchain`
}
…
getPriority(balance.blockchain)   // ← property doesn't exist on the type
```

Under `strict` this is a compile error (`Property 'blockchain' does not
exist on type 'WalletBalance'`). The real shape of the hook's return
values evidently includes `blockchain`; the interface just doesn't
reflect it.

**Fix:** add `blockchain: string` (or a union of known chains, same as
`Blockchain` in the refactor).

---

### 🟡 Typing issues

#### #7 · `getPriority(blockchain: any)`

```ts
const getPriority = (blockchain: any): number => { switch (blockchain) { … } }
```

`any` opts out of type checking — callers can pass anything, and typos in
case labels won't be caught. The `switch`-with-strings pattern is also
both longer and slower than an object lookup.

**Fix:**

```ts
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';
const PRIORITY: Record<Blockchain, number> = { Osmosis: 100, Ethereum: 50, … };
const getPriority = (chain: string): number =>
  PRIORITY[chain as Blockchain] ?? UNKNOWN_PRIORITY;
```

Type-safe, constant-time, and the priority table reads top-down like
config.

#### #8 · Empty interface extends `BoxProps`

```ts
interface Props extends BoxProps {}
```

Triggers `@typescript-eslint/no-empty-object-type`. More importantly, the
indirection is pointless: `Props` *is* `BoxProps`. Every read of `Props`
is just an extra lookup for a future reader.

**Fix:** delete the interface and use `BoxProps` directly, or
`type Props = BoxProps` if a named alias is preferred for re-export.

#### #9 · Redundant `React.FC` + explicit prop typing

```ts
const WalletPage: React.FC<Props> = (props: Props) => { … }
```

Two problems:

1. `(props: Props)` duplicates the typing that `React.FC<Props>` already
   provides — if they ever drift, TypeScript picks the inner one silently.
2. `React.FC` has a few known downsides: it implicitly adds `children` to
   the props contract (which you may not want — see #14), it makes default
   props awkward, and it broke generic components before React 18. The
   Meta / React docs nowadays prefer a plain function declaration.

**Fix:**

```ts
export function WalletPage(props: BoxProps): JSX.Element { … }
```

One annotation, no implicit `children`, works with generics.

---

### 🟢 Performance / React anti-patterns

#### #10 · `useMemo` dependency on unread `prices`

```ts
const sortedBalances = useMemo(() => {
  return balances.filter(…).sort(…);     // prices never referenced
}, [balances, prices]);
```

The memo is re-run every time `prices` updates — which, for a ticking
price feed, could be every second — even though none of the sort/filter
logic reads prices. That defeats the point of memoizing.

**Fix:** either remove `prices` from the deps, or (the better option) fold
the price-dependent work (`usdValue`, `formatted`) *into* the memo, which
legitimizes the dependency and collapses three passes into one. The
refactor takes the latter route.

#### #11 · `formattedBalances` outside any memo

```ts
const formattedBalances = sortedBalances.map(…);   // new array every render
```

Re-allocating the array is cheap in isolation, but every child
`WalletRow` receives new reference identity, which defeats downstream
`React.memo`/`useMemo` optimisations on that component. Combined with
#10, it means the formatting work runs on every parent render, even when
`balances` and `prices` haven't changed.

**Fix:** move the formatting into the pipeline that produces `rows`, and
memoize the whole thing together.

#### #12 · `getPriority` called repeatedly per balance

```ts
.filter(b => {
  const balancePriority = getPriority(b.blockchain);   // 1st call
  …
})
.sort((lhs, rhs) => {
  const leftPriority  = getPriority(lhs.blockchain);   // 2nd
  const rightPriority = getPriority(rhs.blockchain);   // 3rd (per pair)
})
```

Sort does O(n log n) comparisons, and each comparison does two lookups.
For `n` balances, that's roughly **n + 2·n·log n** priority lookups —
fine for the expected small wallet lists, but trivially avoidable.

**Fix:** do one `map` up front that attaches `priority` to each balance,
then filter and sort over the cached field. Total lookups drop to `n`.

```ts
balances
  .map(b => ({ ...b, priority: getPriority(b.blockchain) }))
  .filter(b => b.priority > UNKNOWN_PRIORITY && b.amount > 0)
  .sort((a, b) => b.priority - a.priority)
```

As a bonus, the sort comparator becomes a one-liner that naturally
returns `0` on ties (fixing #3).

#### #13 · `key={index}` on a sortable, filterable list

```ts
<WalletRow key={index} … />
```

When the list is re-sorted or re-filtered, the *index* of a given balance
changes even though the balance itself did not. React sees a "new" key at
position *i* and reconciles by mutating the DOM at that position, which
can swap input focus, lose CSS transitions, or carry over stale
animations to the wrong row.

**Fix:** use a stable key derived from the data. `currency` is unique
within a blockchain but not necessarily across — so
`` `${blockchain}-${currency}` `` is a safe composite.

#### #14 · Destructuring an unused `children`

```ts
const { children, ...rest } = props;
return <div {...rest}>{rows}</div>;
```

`children` is pulled out of props and then silently dropped — any
`<WalletPage>…</WalletPage>` children the caller passes disappear without
warning. If you don't intend to render children, don't destructure them;
if you do, render them.

**Fix:** `<div {...props}>{rows}</div>` (spread everything, including
whatever extra props the caller sent). If children *shouldn't* be
allowed, tighten `BoxProps` to exclude them.

#### #15 · `balance.amount.toFixed()` with no argument

```ts
formatted: balance.amount.toFixed(),
```

`toFixed()` defaults to `0` fraction digits, so `42.5` formats as
`"42"` and `0.999` becomes `"1"`. Almost always not what you want for a
monetary or token balance display.

**Fix:** pick a precision that matches the domain. The refactor uses
`toFixed(2)` as a reasonable default; in a real app this should probably
vary per token (stablecoins vs BTC vs memecoins).

---

## Before vs after

| | Original | Refactored |
| - | - | - |
| Compiles under `strict` | ❌ (undefined `lhsPriority`, missing return, missing `blockchain`) | ✅ |
| Renders the right balances | ❌ (keeps empty, drops positive) | ✅ |
| Rendered `formattedAmount` | `undefined` | `"42.50"` |
| Sort stability | Non-deterministic on ties | Stable (returns `0`) |
| `getPriority` calls per render, `n` balances | ~`n + 2·n·log n` | `n` |
| Memoized work | Sort/filter only, invalidated by unrelated `prices` updates | Whole pipeline, deps actually used |
| List key stability | Index-based (breaks on reorder) | Composite data key |
| Type safety of `getPriority` | `any` | `string` in, `Record<Blockchain, number>` lookup |

## What the refactor does, in one paragraph

Hoists `getPriority` and its lookup table to module scope (one allocation
for the lifetime of the module, type-safe). Inside the component, a single
`useMemo` runs one pipeline — `map → filter → sort → map` — that attaches
priority, filters to positive balances on known chains, sorts by priority
desc, and folds in both `formatted` and `usdValue` in the final step.
`prices` is a real dependency of that last map, so the memo key is
honest. The JSX just iterates the finished rows and uses a composite
`blockchain-currency` key. `React.FC` and the empty `Props` interface are
gone; the component is a plain function taking `BoxProps`.
