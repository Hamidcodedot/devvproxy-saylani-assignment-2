import assert from 'assert';

const BASE_URL = 'http://localhost:3000/api/v1/chat/completions';
const API_KEY = 'devv_live_demo_9481b37c';

console.log('=== RUNNING END-TO-END WIRE AGENT CIRCUIT BREAKER VERIFICATION ===\n');

async function runWireTests() {
  const loopingPrompt = [
    { role: 'system', content: 'You are an autonomous web scraper agent.' },
    { role: 'user', content: 'Parse DOM elements from table #records' },
  ];

  // -------------------------------------------------------------------------
  // TEST 1: Normal Single Request (State CLOSED, Loop Count 1)
  // -------------------------------------------------------------------------
  console.log('1. Testing initial agent request (expecting 200 OK, CLOSED state)...');
  const res1 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Max-Loops': '5',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: loopingPrompt,
    }),
  });

  assert.strictEqual(res1.status, 200, `Expected 200 OK, got ${res1.status}`);
  assert.strictEqual(res1.headers.get('X-Devv-Circuit-Breaker'), 'CLOSED');
  assert.strictEqual(res1.headers.get('X-Devv-Loop-Count'), '1');
  console.log('   ✓ Call 1 passed: State CLOSED, Loop-Count 1');

  // -------------------------------------------------------------------------
  // TEST 2: Rapid Repetition Loop (Calls 2, 3, 4 Allowed; Call 5 TRIPPED)
  // -------------------------------------------------------------------------
  console.log('2. Simulating runaway recursive loop (threshold: 5)...');
  for (let i = 2; i <= 4; i++) {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Devv-Max-Loops': '5',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: loopingPrompt,
      }),
    });
    assert.strictEqual(res.status, 200, `Call ${i} expected 200 OK`);
    assert.strictEqual(res.headers.get('X-Devv-Circuit-Breaker'), 'CLOSED');
    assert.strictEqual(res.headers.get('X-Devv-Loop-Count'), String(i));
    console.log(`   ✓ Call ${i} passed: Loop-Count ${i}`);
  }

  // 5th Call must TRIP the circuit breaker
  console.log('3. Dispatching 5th identical call (expecting 429 TRIPPED)...');
  const res5 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Max-Loops': '5',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: loopingPrompt,
    }),
  });

  assert.strictEqual(res5.status, 429, `Expected 429 Too Many Requests, got ${res5.status}`);
  const cbHeader = res5.headers.get('X-Devv-Circuit-Breaker');
  const countHeader = res5.headers.get('X-Devv-Loop-Count');
  const savedHeader = res5.headers.get('X-Devv-Cost-Saved');
  const retryHeader = res5.headers.get('Retry-After');

  console.log(`   Status: ${res5.status}`);
  console.log(`   X-Devv-Circuit-Breaker: ${cbHeader}`);
  console.log(`   X-Devv-Loop-Count: ${countHeader}`);
  console.log(`   X-Devv-Cost-Saved: ${savedHeader}`);
  console.log(`   Retry-After: ${retryHeader}`);

  assert.strictEqual(cbHeader, 'TRIGGERED');
  assert.strictEqual(countHeader, '5');
  assert.ok(savedHeader && savedHeader.startsWith('$'));
  assert.ok(retryHeader);

  const errorBody = await res5.json();
  assert.strictEqual(errorBody.error.type, 'agent_loop_circuit_breaker');
  assert.strictEqual(errorBody.error.code, 'runaway_recursion_detected');
  console.log('   ✓ 5th call successfully intercepted by Agent Circuit Breaker');

  // -------------------------------------------------------------------------
  // TEST 3: Intercepts 6th Call with 0 Upstream Tokens
  // -------------------------------------------------------------------------
  console.log('4. Dispatching 6th call while circuit is OPEN...');
  const res6 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Max-Loops': '5',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: loopingPrompt,
    }),
  });
  assert.strictEqual(res6.status, 429);
  assert.strictEqual(res6.headers.get('X-Devv-Circuit-Breaker'), 'TRIGGERED');
  console.log('   ✓ 6th call intercepted immediately while OPEN');

  // -------------------------------------------------------------------------
  // TEST 4: Isolated Prompt (Distinct Hash) Passes Through Even When Key Has an Open Breaker
  // -------------------------------------------------------------------------
  console.log('5. Testing fresh prompt on same key (verifying hash isolation)...');
  const resIsolated = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Max-Loops': '5',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Completely different task for agent' }],
    }),
  });
  assert.strictEqual(resIsolated.status, 200, 'Isolated prompt should pass through');
  assert.strictEqual(resIsolated.headers.get('X-Devv-Circuit-Breaker'), 'CLOSED');
  assert.strictEqual(resIsolated.headers.get('X-Devv-Loop-Count'), '1');
  console.log('   ✓ Distinct prompt passed through with fresh counter');

  // -------------------------------------------------------------------------
  // TEST 5: Client Bypass Directive (X-Devv-Circuit-Breaker: disable)
  // -------------------------------------------------------------------------
  console.log('6. Testing client bypass directive (X-Devv-Circuit-Breaker: disable)...');
  const resBypass = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Circuit-Breaker': 'disable',
      'X-Devv-Max-Loops': '5',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: loopingPrompt,
    }),
  });
  assert.strictEqual(resBypass.status, 200, 'Bypass directive should allow request');
  console.log('   ✓ Client bypass directive honored');

  console.log('\n=== ALL 6 WIRE TESTS PASSED END-TO-END! ===\n');
}

runWireTests().catch((err) => {
  console.error('\n✗ WIRE TEST FAILED:', err);
  process.exit(1);
});
