import assert from 'node:assert/strict';
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from './sum_to_n.js';

const cases: Array<[input: number, expected: number]> = [
  [0, 0],
  [1, 1],
  [5, 15],
  [10, 55],
  [100, 5050],
  [1000, 500500],
  [-1, -1],
  [-3, -6],
  [-5, -15],
  [-100, -5050],
];

const impls = { sum_to_n_a, sum_to_n_b, sum_to_n_c } as const;

for (const [name, fn] of Object.entries(impls)) {
  for (const [input, expected] of cases) {
    const actual = fn(input);
    assert.equal(
      actual,
      expected,
      `${name}(${input}) → expected ${expected}, got ${actual}`,
    );
  }
  console.log(`✓ ${name} — ${cases.length} cases passed`);
}

console.log('\nsum_to_n(5) via each implementation:');
console.log(`  sum_to_n_a(5) = ${sum_to_n_a(5)}   // O(1)  closed-form`);
console.log(`  sum_to_n_b(5) = ${sum_to_n_b(5)}   // O(n)  iterative`);
console.log(`  sum_to_n_c(5) = ${sum_to_n_c(5)}   // O(n)  recursive`);

// Demonstrate that A and B scale safely while C cannot.
const LARGE = 1_000_000;
console.log(`\nsum_to_n(${LARGE.toLocaleString()}):`);
console.log(`  sum_to_n_a: ${sum_to_n_a(LARGE).toLocaleString()}  (instant)`);
const t0 = performance.now();
const iter = sum_to_n_b(LARGE);
const t1 = performance.now();
console.log(
  `  sum_to_n_b: ${iter.toLocaleString()}  (${(t1 - t0).toFixed(1)} ms)`,
);
console.log(
  `  sum_to_n_c: would throw "Maximum call stack size exceeded" — skipped`,
);
