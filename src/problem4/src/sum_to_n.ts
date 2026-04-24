/**
 * Approach A — Closed-form (Gauss) summation.
 *
 * Applies the identity  1 + 2 + … + n  =  n · (n + 1) / 2  directly.
 * For negative `n`, the same magnitude applies with flipped sign —
 * e.g. sum_to_n(-3) = -1 + -2 + -3 = -(1 + 2 + 3) = -6.
 *
 * Time  : O(1) — a constant number of arithmetic ops, independent of n.
 * Space : O(1) — no auxiliary storage.
 *
 * Preferred in real code. The caller guarantees the result fits in
 * Number.MAX_SAFE_INTEGER, so no overflow concern for the intermediate
 * product either.
 */
export function sum_to_n_a(n: number): number {
  const sign = Math.sign(n);
  const abs = Math.abs(n);
  return (sign * abs * (abs + 1)) / 2;
}

/**
 * Approach B — Iterative accumulation.
 *
 * Walks 1..n (or -1..n for negatives) and accumulates the running sum.
 * The most straightforward implementation — what a novice writes first,
 * and the one easiest to extend if each step needs extra per-element work
 * (logging, side-effects, etc.).
 *
 * Time  : O(n) — one addition per element.
 * Space : O(1) — only the accumulator and the loop counter.
 *
 * Safe for any |n| within the integer-safe range; predictable memory
 * profile, unlike the recursive version.
 */
export function sum_to_n_b(n: number): number {
  let sum = 0;
  if (n >= 0) {
    for (let i = 1; i <= n; i++) sum += i;
  } else {
    for (let i = -1; i >= n; i--) sum += i;
  }
  return sum;
}

/**
 * Approach C — Recursive reduction.
 *
 * Expresses the textbook recurrence directly:
 *   sum(n) = n + sum(n ∓ 1),  sum(0) = 0.
 *
 * Time  : O(n) — one recursive call per step.
 * Space : O(n) — each call consumes a JS engine stack frame. V8/Node do
 *         NOT perform tail-call optimisation in practice (strict-mode TCO
 *         from the ES2015 spec is unimplemented), so this throws
 *         "Maximum call stack size exceeded" somewhere around |n| ≈ 10⁴.
 *
 * That stack limit sits far below the value implied by the
 * Number.MAX_SAFE_INTEGER assumption (|n| ≈ 1.34 × 10⁸). This is the
 * central tradeoff vs. the iterative version and the reason recursion is
 * pedagogical here rather than production-grade.
 */
export function sum_to_n_c(n: number): number {
  if (n === 0) return 0;
  return n + sum_to_n_c(n > 0 ? n - 1 : n + 1);
}
