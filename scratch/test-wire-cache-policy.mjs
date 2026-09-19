import assert from 'assert';

const BASE_URL = 'http://localhost:3000/api/v1/chat/completions';
const API_KEY = 'devv_live_demo_9481b37c'; // Demo Virtual API key

console.log('=== RUNNING END-TO-END WIRE CACHE POLICY VERIFICATION ===\n');

async function testLiveWire() {
  // -------------------------------------------------------------------------
  // TEST 1: Volatile Query Bypass (The Bitcoin Problem)
  // -------------------------------------------------------------------------
  console.log('1. Testing Volatile Real-Time Query ("What is the price of Bitcoin today?")...');
  const res1 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'What is the price of Bitcoin today?' }],
    }),
  });

  assert.strictEqual(res1.status, 200, `Expected 200 OK, got ${res1.status}`);
  const cacheHeader1 = res1.headers.get('X-Devv-Cache');
  const policyHeader1 = res1.headers.get('X-Devv-Cache-Policy');
  const bypassReason1 = res1.headers.get('X-Devv-Cache-Bypass-Reason');

  console.log(`   Call #1 Status: ${res1.status}`);
  console.log(`   X-Devv-Cache: ${cacheHeader1}`);
  console.log(`   X-Devv-Cache-Policy: ${policyHeader1}`);
  console.log(`   X-Devv-Cache-Bypass-Reason: ${bypassReason1}`);

  assert.strictEqual(cacheHeader1, 'BYPASS', 'Expected volatile query to bypass cache');
  assert.strictEqual(policyHeader1, 'volatile', 'Expected policy to be volatile');
  assert.ok(bypassReason1, 'Expected bypass reason to be present');

  // Verify that dispatching the same volatile prompt again does NOT hit cache
  console.log('2. Dispatching duplicate volatile query (Verifying it is NOT cached)...');
  const res2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'What is the price of Bitcoin today?' }],
    }),
  });

  const cacheHeader2 = res2.headers.get('X-Devv-Cache');
  console.log(`   Call #2 X-Devv-Cache: ${cacheHeader2}`);
  assert.strictEqual(cacheHeader2, 'BYPASS', 'Volatile query must NEVER be served from cache');

  // -------------------------------------------------------------------------
  // TEST 2: Invariant Static Knowledge Query (Dijkstra Algorithm)
  // -------------------------------------------------------------------------
  console.log('\n3. Testing Invariant Static Query (Call #1 - Expecting Cache MISS)...');
  const staticPrompt = 'Explain the mathematical foundation of Dijkstra shortest path algorithm.';
  const resStatic1 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: staticPrompt }],
    }),
  });

  const cacheHeaderStatic1 = resStatic1.headers.get('X-Devv-Cache');
  const policyStatic1 = resStatic1.headers.get('X-Devv-Cache-Policy');
  const ttlStatic1 = resStatic1.headers.get('X-Devv-Cache-TTL');

  console.log(`   Call #1 X-Devv-Cache: ${cacheHeaderStatic1}`);
  console.log(`   Call #1 X-Devv-Cache-Policy: ${policyStatic1}`);
  console.log(`   Call #1 X-Devv-Cache-TTL: ${ttlStatic1}`);

  assert.strictEqual(cacheHeaderStatic1, 'MISS', 'Expected first static call to be MISS');
  assert.strictEqual(policyStatic1, 'static', 'Expected static policy');
  assert.strictEqual(ttlStatic1, '2592000s', 'Expected 30-day default TTL');

  console.log('4. Testing Duplicate Invariant Query (Call #2 - Expecting 0ms Cache HIT)...');
  const resStatic2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: staticPrompt }],
    }),
  });

  const cacheHeaderStatic2 = resStatic2.headers.get('X-Devv-Cache');
  const policyStatic2 = resStatic2.headers.get('X-Devv-Cache-Policy');
  const expiresInStatic2 = resStatic2.headers.get('X-Devv-Cache-Expires-In');

  console.log(`   Call #2 X-Devv-Cache: ${cacheHeaderStatic2}`);
  console.log(`   Call #2 X-Devv-Cache-Policy: ${policyStatic2}`);
  console.log(`   Call #2 X-Devv-Cache-Expires-In: ${expiresInStatic2}`);

  assert.strictEqual(cacheHeaderStatic2, 'HIT', 'Expected second static call to be HIT');
  assert.strictEqual(policyStatic2, 'static');
  assert.ok(expiresInStatic2, 'Expected expires-in header');

  // -------------------------------------------------------------------------
  // TEST 3: Client Directives (X-Devv-Cache-Control: no-cache)
  // -------------------------------------------------------------------------
  console.log('\n5. Testing Client Override (X-Devv-Cache-Control: no-cache)...');
  const resOverride = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Cache-Control': 'no-cache',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: staticPrompt }],
    }),
  });

  const cacheHeaderOverride = resOverride.headers.get('X-Devv-Cache');
  const policyOverride = resOverride.headers.get('X-Devv-Cache-Policy');
  const bypassReasonOverride = resOverride.headers.get('X-Devv-Cache-Bypass-Reason');

  console.log(`   Override X-Devv-Cache: ${cacheHeaderOverride}`);
  console.log(`   Override X-Devv-Cache-Policy: ${policyOverride}`);
  console.log(`   Override X-Devv-Cache-Bypass-Reason: ${bypassReasonOverride}`);

  assert.strictEqual(cacheHeaderOverride, 'BYPASS', 'Expected client no-cache to bypass');
  assert.strictEqual(policyOverride, 'client_override');
  assert.strictEqual(bypassReasonOverride, 'client_no_cache');

  // -------------------------------------------------------------------------
  // TEST 4: Client Custom TTL (X-Devv-Cache-TTL: 60)
  // -------------------------------------------------------------------------
  console.log('\n6. Testing Client Custom TTL (X-Devv-Cache-TTL: 60)...');
  const resCustomTtl = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Cache-TTL': '60',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Explain binary search trees in Python.' }],
    }),
  });

  const ttlHeader = resCustomTtl.headers.get('X-Devv-Cache-TTL');
  const policyCustomTtl = resCustomTtl.headers.get('X-Devv-Cache-Policy');

  console.log(`   Custom TTL X-Devv-Cache-Policy: ${policyCustomTtl}`);
  console.log(`   Custom TTL X-Devv-Cache-TTL: ${ttlHeader}`);

  assert.strictEqual(policyCustomTtl, 'client_override');
  assert.strictEqual(ttlHeader, '60s');

  console.log('\n=== ALL 6 END-TO-END WIRE CACHE TESTS PASSED WITH 100% SUCCESS ===\n');
}

testLiveWire().catch((err) => {
  console.error('\n✗ TEST FAILED:', err);
  process.exit(1);
});
