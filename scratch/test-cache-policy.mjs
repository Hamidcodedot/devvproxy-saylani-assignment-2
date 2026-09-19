import assert from 'assert';
import { evaluateCachePolicy, detectVolatility, extractQueryText } from '../src/lib/cache-policy.ts';

console.log('=== STARTING TEST SUITE: SMART TTL & VOLATILITY CACHE DEFENSE ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE 1: Volatility Detection Patterns (The Bitcoin / Weather Cases)
// ---------------------------------------------------------------------------
console.log('--- Suite 1: Volatility Detection Patterns ---');

runTest('Detects direct crypto price inquiry ("price of bitcoin")', () => {
  const reason = detectVolatility('What is the price of Bitcoin today?');
  assert.ok(reason, 'Expected volatility detection');
  assert.strictEqual(reason, 'price_inquiry_detected');
});

runTest('Detects financial ticker inquiry ("how much is 1 BTC")', () => {
  const reason = detectVolatility('how much is 1 btc right now');
  assert.ok(reason, 'Expected volatility detection');
});

runTest('Detects stock price volatility ("current value of AAPL stock")', () => {
  const reason = detectVolatility('current value of AAPL stock');
  assert.ok(reason, 'Expected volatility detection');
});

runTest('Detects real-time temporal markers ("breaking news today")', () => {
  const reason = detectVolatility('Give me the breaking news today about tech startups');
  assert.strictEqual(reason, 'temporal_marker_detected');
});

runTest('Detects live weather queries ("weather in Tokyo right now")', () => {
  const reason = detectVolatility('What is the weather in Tokyo right now?');
  assert.ok(reason, 'Expected weather volatility detection');
});

runTest('Identifies invariant static prompt as NOT volatile ("quicksort in Rust")', () => {
  const reason = detectVolatility('Write a memory-safe implementation of quicksort in Rust with tests.');
  assert.strictEqual(reason, null, 'Expected invariant prompt to have null volatility');
});

runTest('Identifies general knowledge prompt as NOT volatile ("capital of France")', () => {
  const reason = detectVolatility('What is the capital of France and what is its history?');
  assert.strictEqual(reason, null, 'Expected invariant prompt to have null volatility');
});

// ---------------------------------------------------------------------------
// TEST SUITE 2: Policy Evaluation & Actions
// ---------------------------------------------------------------------------
console.log('\n--- Suite 2: Policy Evaluation Decisions ---');

runTest('Evaluates volatile query to BYPASS with 0s TTL', () => {
  const messages = [{ role: 'user', content: 'What is the price of bitcoin?' }];
  const decision = evaluateCachePolicy(messages);
  assert.strictEqual(decision.action, 'BYPASS');
  assert.strictEqual(decision.policyType, 'volatile');
  assert.strictEqual(decision.ttlSeconds, 0);
});

runTest('Evaluates static query to CACHE with 30-day default TTL', () => {
  const messages = [{ role: 'user', content: 'Explain Dijkstra shortest path algorithm.' }];
  const decision = evaluateCachePolicy(messages);
  assert.strictEqual(decision.action, 'CACHE');
  assert.strictEqual(decision.policyType, 'static');
  assert.strictEqual(decision.ttlSeconds, 30 * 24 * 60 * 60);
});

// ---------------------------------------------------------------------------
// TEST SUITE 3: Client Cache-Control Directives
// ---------------------------------------------------------------------------
console.log('\n--- Suite 3: Client Cache-Control Directives ---');

runTest('Respects X-Devv-Cache-Control: no-cache on static prompt', () => {
  const messages = [{ role: 'user', content: 'Explain Dijkstra shortest path algorithm.' }];
  const headers = { 'x-devv-cache-control': 'no-cache' };
  const decision = evaluateCachePolicy(messages, headers);
  assert.strictEqual(decision.action, 'BYPASS');
  assert.strictEqual(decision.policyType, 'client_override');
  assert.strictEqual(decision.reason, 'client_no_cache');
});

runTest('Respects standard Cache-Control: max-age=0 to bypass cache', () => {
  const messages = [{ role: 'user', content: 'Explain Dijkstra shortest path algorithm.' }];
  const headers = { 'cache-control': 'max-age=0' };
  const decision = evaluateCachePolicy(messages, headers);
  assert.strictEqual(decision.action, 'BYPASS');
  assert.strictEqual(decision.policyType, 'client_override');
  assert.strictEqual(decision.reason, 'client_max_age_zero');
});

runTest('Respects X-Devv-Cache-TTL header (custom 300s TTL)', () => {
  const messages = [{ role: 'user', content: 'Summarize quarterly release notes' }];
  const headers = { 'x-devv-cache-ttl': '300' };
  const decision = evaluateCachePolicy(messages, headers);
  assert.strictEqual(decision.action, 'CACHE');
  assert.strictEqual(decision.policyType, 'client_override');
  assert.strictEqual(decision.ttlSeconds, 300);
});

// ---------------------------------------------------------------------------
// TEST SUITE 4: Performance & Latency Overhead Benchmark (< 0.05ms)
// ---------------------------------------------------------------------------
console.log('\n--- Suite 4: Latency & ReDoS Benchmark ---');

runTest('Executes policy evaluation in under 0.05ms per prompt over 1,000 iterations', () => {
  const testPrompts = [
    'What is the price of Bitcoin today?',
    'Write a quicksort algorithm in Rust.',
    'Weather in Karachi right now',
    'Explain the theory of relativity in simple terms.',
    'how much is 1 eth worth',
    'Create an SQL schema for multi-tenant users with RLS.',
  ];

  const iterations = 1000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const prompt = testPrompts[i % testPrompts.length];
    evaluateCachePolicy([{ role: 'user', content: prompt }]);
  }
  const totalMs = performance.now() - start;
  const avgMs = totalMs / iterations;

  console.log(`   Benchmark: ${iterations} evaluations completed in ${totalMs.toFixed(2)}ms (Avg: ${avgMs.toFixed(4)}ms/call)`);
  assert.ok(avgMs < 0.05, `Average latency (${avgMs}ms) exceeded 0.05ms limit`);
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}
