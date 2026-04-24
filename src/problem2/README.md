# Problem 2 — Fancy Swap

**Live demo:** <https://problem2-six.vercel.app/>

A currency swap form inspired by modern DEX interfaces (Uniswap, PancakeSwap).
Users choose two tokens, enter an amount, and see the exchange result computed
in real time from live token prices.

## Stack

| Concern        | Choice                                  | Why                                                                 |
| -------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Build tool     | **Vite 5**                              | Bonus requirement; instant dev server, fast HMR                     |
| UI             | **React 18 + TypeScript**               | Type-safe component model                                           |
| Styling        | **Tailwind CSS**                        | Utility-first, no runtime cost, easy to match a consistent system   |
| Form state     | **react-hook-form**                     | Uncontrolled inputs, minimal re-renders, good DX for form fields    |
| Validation     | **Zod** (via `@hookform/resolvers/zod`) | Schema-first; cross-field rules (from ≠ to) in one place            |
| Data fetching  | **@tanstack/react-query**               | Built-in caching, retry, loading/error states for the prices API    |

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle -> dist/
npm run typecheck  # type-check only
```

## Features

- **Live prices** fetched from `interview.switcheo.com/prices.json`
- **Real token icons** loaded from `Switcheo/token-icons` (graceful fallback to
  initials if an SVG is missing)
- **Searchable token dropdown** with a disabled state for the token already
  selected in the other side
- **Two-way direction flip** button (⇵) between the two inputs
- **Real-time exchange calculation** — output amount and USD value update as
  you type
- **Form validation** with inline error messages:
  - Amount required, must be a valid positive number
  - Both tokens must be selected
  - From/To tokens must differ
- **Mock submit flow** — 1.5 s simulated network delay, spinner on the button,
  success toast showing what was swapped, then form resets
- **Keyboard-friendly** — Esc closes the token dropdown; outside clicks
  dismiss it
- **Responsive** — works on mobile widths down to 360 px

## Design decisions

### Deduping the prices feed
The API returns multiple entries for the same currency (e.g. two `BUSD` rows
with slightly different prices). `lib/tokens.ts#toTokens` keeps only the
**latest by `date`** per currency and drops entries with a missing or
non-positive price — matching the task's "tokens without a price can be
omitted" rule.

### Why two separate files for exchange logic and validation
- `lib/tokens.ts` — pure price/formatting helpers (no React, easy to unit test)
- `lib/validation.ts` — Zod schema, shared by the form resolver and any future
  API boundary

### Uncontrolled form with `Controller` wrappers
The two `TokenSelect` components and the amount input need to participate in
react-hook-form's validation lifecycle. `Controller` gives each field the
right `onChange` / `value` binding without turning every keystroke into a
re-render of the full form.

### Fallback for missing icons
`TokenIcon` swaps the `<img>` for a styled initial badge on `onError`. This
keeps the dropdown usable even when an icon 404s from the token-icons repo.

### Mock backend
As permitted by the task hint, `hooks/useSwap.ts` fakes the submit via
`setTimeout`. The button reflects three states: `idle`, `submitting` (spinner
+ disabled), and `success` (toast + form reset). Wiring a real API would mean
replacing that `setTimeout` with a `fetch` call — the surrounding component
code stays the same.

## Folder layout

```
src/
├── components/
│   ├── AmountInput.tsx    # amount field + token selector row
│   ├── SwapForm.tsx       # orchestrates both sides + submit
│   ├── TokenIcon.tsx      # <img> with initials fallback
│   ├── TokenSelect.tsx    # searchable dropdown
│   └── ui/Spinner.tsx
├── hooks/
│   ├── useSwap.ts         # mock submit state machine
│   └── useTokenPrices.ts  # react-query wrapper
├── lib/
│   ├── api.ts             # fetch prices.json
│   ├── tokens.ts          # dedupe, math, formatting
│   └── validation.ts      # Zod schema
├── styles/index.css
├── App.tsx
├── main.tsx
└── types.ts
```

## What I deliberately left out

- **Router / multi-page** — single screen, doesn't need one
- **State management library** — everything is either form state, query state,
  or local component state; Redux/Zustand would be overkill
- **Full test suite** — out of scope for a 16 h challenge; the pure logic in
  `lib/tokens.ts` is the easiest thing to add Vitest coverage for if needed
