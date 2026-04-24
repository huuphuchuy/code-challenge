# Problem 4 — Three Ways to Sum to n

Three implementations of `sum_to_n(n: number): number` returning the summation
`1 + 2 + … + n` for non-negative `n`, and the symmetric `-1 + -2 + … + n` for
negative `n` (since the prompt says input is "any integer").

## Complexity summary

| # | Approach                | Time     | Space    | Notes |
| - | ----------------------- | -------- | -------- | ----- |
| A | Closed-form `n·(n+1)/2` | **O(1)** | **O(1)** | Optimal. Use this in real code. |
| B | Iterative loop          | O(n)     | O(1)     | Easy to read; trivial to extend with per-step work. |
| C | Recursion               | O(n)     | O(n)     | Pedagogical only — **unsafe** for large \|n\| (stack overflow). |

The task assumes the result fits in `Number.MAX_SAFE_INTEGER`, which implies
`|n| ≤ ~1.34 × 10⁸`. Approach A handles that upper bound in constant time;
approach C throws `Maximum call stack size exceeded` around `|n| ≈ 10⁴`
because V8/Node do not perform tail-call optimisation.

## Run

```bash
npm install
npm start         # runs assertions on 10 cases (pos / zero / neg) and
                  # prints a side-by-side demo + timing comparison
npm run typecheck # tsc --noEmit, strict mode
```

Expected output (abridged):

```
✓ sum_to_n_a — 10 cases passed
✓ sum_to_n_b — 10 cases passed
✓ sum_to_n_c — 10 cases passed

sum_to_n(5) via each implementation:
  sum_to_n_a(5) = 15   // O(1)  closed-form
  sum_to_n_b(5) = 15   // O(n)  iterative
  sum_to_n_c(5) = 15   // O(n)  recursive
```

## Files

```
src/
├── sum_to_n.ts   # the three implementations, each with JSDoc analysis
└── main.ts       # assertion-based test runner + demo
```

## Design notes

- **Negative inputs.** The prompt says input is "any integer". I interpret
  `sum_to_n(-n)` symmetrically so that `sum_to_n(-k) = -sum_to_n(k)`. All three
  implementations follow that convention and therefore agree on every input.
- **No external test framework.** Node's built-in `node:assert/strict` is
  enough for a 3-function file — pulling in Vitest/Jest here would be
  ceremony, not engineering.
- **Why still include C when it's inferior?** The task asks explicitly to
  "comment on complexity or efficiency of each function". Showing a recursive
  solution alongside the iterative one makes the O(1) space advantage of the
  loop (and the engine-specific stack-size ceiling) concrete instead of
  abstract.
