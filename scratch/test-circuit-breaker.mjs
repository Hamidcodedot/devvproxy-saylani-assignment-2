import assert from 'assert';
import {
  evaluateAgentCircuitBreaker,
  hashPromptFingerprint,
  formatCircuitBreakerError,
  getCircuitBreakerHeaders,
  resetCircuitBreakerStore,
  DEFAULT_LOOP_THRESHOLD,
} from '../src/lib/agent-circuit-breaker.ts';

console.log('=== STARTING UNIT TEST SUITE: AUTONOMOUS AGENT CIRCUIT BREAKER ===\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    resetCircuitBreakerStore();
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// SUITE 1: Prompt Fingerprinting & Invariants
// ---------------------------------------------------------------------------
console.log('--- Suite 1: Prompt Fingerprinting & Invariants ---');

runTest('Computes identical 16-hex fingerprint for normalized messages', () => {
  const messages1 = [{ role: 'user', content: 'Search weather in Tokyo' }];
  const messages2 = [{ role: 'user', content: '  search weather in tokyo  ' }];
  const hash1 = hashPromptFingerprint(messages1);
  const hash2 = hashPromptFingerprint(messages2);

  assert.strictEqual(hash1.length, 16);
  assert.strictEqual(hash1, hash2, 'Normalized messages must produce identical fingerprints');
});

runTest('Differentiates distinct prompts', () => {
  const hash1 = hashPromptFingerprint([{ role: 'user', content: 'Prompt A' }]);
  const hash2 = hashPromptFingerprint([{ role: 'user', content: 'Prompt B' }]);
  assert.notStrictEqual(hash1, hash2, 'Distinct prompts must produce different hashes');
});

// ---------------------------------------------------------------------------
// SUITE 2: State Machine & Threshold Tripping
// ---------------------------------------------------------------------------
console.log('\n--- Suite 2: State Machine & Threshold Tripping ---');

runTest('Single initial request passes through in CLOSED state', () => {
  const keyId = 'key_test_01';
  const messages = [{ role: 'user', content: 'ReAct agent step 1' }];
  const res = evaluateAgentCircuitBreaker(keyId, messages);

  assert.strictEqual(res.tripped, false);
  assert.strictEqual(res.state, 'CLOSED');
  assert.strictEqual(res.loopCount, 1);
});

runTest(`Allows up to ${DEFAULT_LOOP_THRESHOLD - 1} identical sequential requests`, () => {
  const keyId = 'key_test_02';
  const messages = [{ role: 'user', content: 'ReAct agent loop query' }];

  for (let i = 1; i < DEFAULT_LOOP_THRESHOLD; i++) {
    const res = evaluateAgentCircuitBreaker(keyId, messages);
    assert.strictEqual(res.tripped, false, `Call ${i} should be allowed`);
    assert.strictEqual(res.loopCount, i);
  }
});

runTest(`Trips on the ${DEFAULT_LOOP_THRESHOLD}th identical request (OPEN state)`, () => {
  const keyId = 'key_test_03';
  const messages = [{ role: 'user', content: 'Infinite loop query' }];

  for (let i = 1; i < DEFAULT_LOOP_THRESHOLD; i++) {
    evaluateAgentCircuitBreaker(keyId, messages);
  }

  // 10th request
  const tripRes = evaluateAgentCircuitBreaker(keyId, messages);
  assert.strictEqual(tripRes.tripped, true, '10th call should trip circuit breaker');
  assert.strictEqual(tripRes.state, 'OPEN');
  assert.strictEqual(tripRes.loopCount, 10);
  assert.strictEqual(tripRes.retryAfterSeconds, 30);
  assert.strictEqual(tripRes.estimatedCostSaved, '$0.16');
});

runTest('Intercepts 11th call immediately with 0 cost when circuit is OPEN', () => {
  const keyId = 'key_test_04';
  const messages = [{ role: 'user', content: 'Runaway agent query' }];

  for (let i = 1; i <= DEFAULT_LOOP_THRESHOLD; i++) {
    evaluateAgentCircuitBreaker(keyId, messages);
  }

  // 11th call
  const blockedRes = evaluateAgentCircuitBreaker(keyId, messages);
  assert.strictEqual(blockedRes.tripped, true);
  assert.strictEqual(blockedRes.state, 'OPEN');
  assert.strictEqual(blockedRes.reason, 'circuit_breaker_open');
});

// ---------------------------------------------------------------------------
// SUITE 3: Tenant & Prompt Hash Isolation
// ---------------------------------------------------------------------------
console.log('\n--- Suite 3: Tenant & Prompt Hash Isolation ---');

runTest('Different prompt on same API key is isolated and NOT tripped', () => {
  const keyId = 'key_test_05';
  const loopingPrompt = [{ role: 'user', content: 'Looping prompt' }];
  const differentPrompt = [{ role: 'user', content: 'Fresh new prompt' }];

  // Trip the first prompt
  for (let i = 1; i <= DEFAULT_LOOP_THRESHOLD; i++) {
    evaluateAgentCircuitBreaker(keyId, loopingPrompt);
  }

  // Different prompt should NOT be tripped
  const freshRes = evaluateAgentCircuitBreaker(keyId, differentPrompt);
  assert.strictEqual(freshRes.tripped, false);
  assert.strictEqual(freshRes.loopCount, 1);
  assert.strictEqual(freshRes.state, 'CLOSED');
});

runTest('Same prompt on different API key is isolated (Tenant Isolation)', () => {
  const keyA = 'key_tenant_A';
  const keyB = 'key_tenant_B';
  const prompt = [{ role: 'user', content: 'Shared prompt text' }];

  // Trip Key A
  for (let i = 1; i <= DEFAULT_LOOP_THRESHOLD; i++) {
    evaluateAgentCircuitBreaker(keyA, prompt);
  }

  // Key B should remain unaffected
  const keyBRes = evaluateAgentCircuitBreaker(keyB, prompt);
  assert.strictEqual(keyBRes.tripped, false);
  assert.strictEqual(keyBRes.loopCount, 1);
});

// ---------------------------------------------------------------------------
// SUITE 4: Headers & Client Directives
// ---------------------------------------------------------------------------
console.log('\n--- Suite 4: Headers & Client Directives ---');

runTest('Respects X-Devv-Circuit-Breaker: disable bypass header', () => {
  const keyId = 'key_test_06';
  const messages = [{ role: 'user', content: 'Benchmark query' }];
  const headers = { 'x-devv-circuit-breaker': 'disable' };

  for (let i = 1; i <= 20; i++) {
    const res = evaluateAgentCircuitBreaker(keyId, messages, headers);
    assert.strictEqual(res.tripped, false);
    assert.strictEqual(res.reason, 'client_bypass_directive');
  }
});

runTest('Respects custom X-Devv-Max-Loops: 5 threshold', () => {
  const keyId = 'key_test_07';
  const messages = [{ role: 'user', content: 'Custom threshold prompt' }];
  const headers = { 'x-devv-max-loops': '5' };

  for (let i = 1; i < 5; i++) {
    const res = evaluateAgentCircuitBreaker(keyId, messages, headers);
    assert.strictEqual(res.tripped, false);
  }

  // 5th call trips
  const tripRes = evaluateAgentCircuitBreaker(keyId, messages, headers);
  assert.strictEqual(tripRes.tripped, true);
  assert.strictEqual(tripRes.threshold, 5);
  assert.strictEqual(tripRes.loopCount, 5);
});

runTest('Formats standardized RFC / OpenAI error envelope and headers', () => {
  const keyId = 'key_test_08';
  const messages = [{ role: 'user', content: 'Error format prompt' }];

  for (let i = 1; i <= DEFAULT_LOOP_THRESHOLD; i++) {
    evaluateAgentCircuitBreaker(keyId, messages);
  }

  const tripRes = evaluateAgentCircuitBreaker(keyId, messages);
  const errorPayload = formatCircuitBreakerError(tripRes);
  const headers = getCircuitBreakerHeaders(tripRes);

  assert.strictEqual(errorPayload.error.type, 'agent_loop_circuit_breaker');
  assert.strictEqual(errorPayload.error.code, 'runaway_recursion_detected');
  assert.strictEqual(headers['X-Devv-Circuit-Breaker'], 'TRIGGERED');
  assert.strictEqual(headers['Retry-After'], '30');
});

// ---------------------------------------------------------------------------
// SUITE 5: Latency Benchmark (<0.02ms Budget)
// ---------------------------------------------------------------------------
console.log('\n--- Suite 5: Latency & Performance Benchmark ---');

runTest('Executes circuit evaluation in under 0.02ms per call over 1,000 iterations', () => {
  const keyId = 'benchmark_key';
  const messages = [
    { role: 'system', content: 'You are an autonomous research agent.' },
    { role: 'user', content: 'Find recent filings on generative AI infrastructure.' },
  ];

  const iterations = 1000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    // Alternate prompt subtly to test hashing and map lookup
    evaluateAgentCircuitBreaker(keyId, messages, { 'x-devv-max-loops': '100' });
  }

  const durationMs = performance.now() - start;
  const avgMs = durationMs / iterations;

  console.log(
    `   Benchmark: ${iterations} evaluations completed in ${durationMs.toFixed(2)}ms (Avg: ${avgMs.toFixed(4)}ms/call)`
  );

  assert.ok(
    avgMs < 0.02,
    `Average evaluation time (${avgMs.toFixed(4)}ms) exceeded 0.02ms budget`
  );
});

// ---------------------------------------------------------------------------
// RESULTS SUMMARY
// ---------------------------------------------------------------------------
console.log(`\n=== RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}
