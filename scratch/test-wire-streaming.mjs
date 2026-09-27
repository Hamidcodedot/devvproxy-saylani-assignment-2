import assert from 'assert';

const BASE_URL = 'http://localhost:3000/api/v1/chat/completions';
const API_KEY = 'devv_live_demo_9481b37c';

console.log('=== RUNNING COMPREHENSIVE WIRE STREAMING & PIPELINE VERIFICATION ===\n');

async function parseSseStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let buffer = '';
  let fullAssembledText = '';
  let receivedDone = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();

      if (dataStr === '[DONE]') {
        receivedDone = true;
        continue;
      }

      try {
        const json = JSON.parse(dataStr);
        chunks.push(json);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) fullAssembledText += delta;
      } catch (err) {
        console.error('Failed to parse SSE JSON line:', line, err);
      }
    }
  }

  return { chunks, fullAssembledText, receivedDone };
}

async function runTests() {
  const uniqueId = Math.random().toString(36).substring(2, 8);
  const streamPrompt = [
    { role: 'system', content: 'You are a technical assistant.' },
    { role: 'user', content: `Explain the Raft consensus protocol in 2 sentences. Session ${uniqueId}` },
  ];

  // -------------------------------------------------------------------------
  // TEST 1: First Streaming Request (Cache MISS)
  // -------------------------------------------------------------------------
  console.log('1. Testing stream: true Cache MISS request...');
  const t0 = Date.now();
  const res1 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: streamPrompt,
      stream: true,
    }),
  });

  const ttft1 = Date.now() - t0;
  assert.strictEqual(res1.status, 200, `Expected 200 OK, got ${res1.status}`);
  assert(res1.headers.get('content-type')?.includes('text/event-stream'), 'Content-Type must be text/event-stream');
  assert.strictEqual(res1.headers.get('x-accel-buffering'), 'no', 'X-Accel-Buffering must be no');
  assert(res1.headers.get('cache-control')?.includes('no-transform'), 'Cache-Control must contain no-transform');
  assert.strictEqual(res1.headers.get('x-devv-cache'), 'MISS', 'Expected X-Devv-Cache: MISS on first call');

  const streamResult1 = await parseSseStream(res1);
  assert(streamResult1.receivedDone, 'Stream must end with data: [DONE]');
  assert(streamResult1.chunks.length > 0, 'Must receive at least one chunk');
  assert.strictEqual(streamResult1.chunks[0].object, 'chat.completion.chunk');
  assert(streamResult1.fullAssembledText.length > 10, 'Must receive non-empty assembled text');

  console.log(`   ✓ Stream 1 received: ${streamResult1.chunks.length} chunks in ${ttft1}ms (TTFT). Cache: MISS.`);
  console.log(`   Snippet: "${streamResult1.fullAssembledText.slice(0, 70)}..."`);

  // Allow after() background task to commit L1 cache
  await new Promise((r) => setTimeout(r, 60));

  // -------------------------------------------------------------------------
  // TEST 2: Second Identical Streaming Request (Instant Cache HIT < 15ms)
  // -------------------------------------------------------------------------
  console.log('\n2. Testing duplicate stream: true request (Instant L1 Synthetic Cache HIT)...');
  const tCacheStart = Date.now();
  const res2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: streamPrompt,
      stream: true,
    }),
  });

  const cacheHitLatency = Date.now() - tCacheStart;
  assert.strictEqual(res2.status, 200, `Expected 200 OK, got ${res2.status}`);
  assert.strictEqual(res2.headers.get('x-devv-cache'), 'HIT', 'Expected X-Devv-Cache: HIT');
  assert.strictEqual(res2.headers.get('x-devv-provider'), 'cache');
  assert(res2.headers.get('content-type')?.includes('text/event-stream'));

  const streamResult2 = await parseSseStream(res2);
  assert(streamResult2.receivedDone, 'Cached stream must end with data: [DONE]');
  assert.strictEqual(streamResult2.fullAssembledText.trim(), streamResult1.fullAssembledText.trim(), 'Cached stream text must match original');
  console.log(`   ✓ Stream 2 Cache HIT completed in ${cacheHitLatency}ms! Payload matched original.`);

  // -------------------------------------------------------------------------
  // TEST 3: PII Masking during Streaming
  // -------------------------------------------------------------------------
  console.log('\n3. Testing PII Masking with stream: true...');
  const res3 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Contact alice.crypto@proton.me with card 4242-4242-4242-4242 for validation.' },
      ],
      stream: true,
    }),
  });

  assert.strictEqual(res3.status, 200);
  const scrubbedCount = parseInt(res3.headers.get('x-devv-pii-scrubbed') || '0', 10);
  assert(scrubbedCount >= 2, `Expected at least 2 PII entities scrubbed, got ${scrubbedCount}`);
  await parseSseStream(res3);
  console.log(`   ✓ Stream 3 scrubbed ${scrubbedCount} PII entities (email + card) before streaming`);

  // -------------------------------------------------------------------------
  // TEST 4: Cache Bypass with stream: true
  // -------------------------------------------------------------------------
  console.log('\n4. Testing Cache Bypass directive (X-Devv-Cache-Control: no-cache) with stream: true...');
  const res4 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Devv-Cache-Control': 'no-cache',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: streamPrompt, // Normally a cache hit
      stream: true,
    }),
  });

  assert.strictEqual(res4.status, 200);
  assert.strictEqual(res4.headers.get('x-devv-cache'), 'BYPASS', 'Expected X-Devv-Cache: BYPASS');
  const streamResult4 = await parseSseStream(res4);
  assert(streamResult4.receivedDone);
  console.log('   ✓ Stream 4 honored client bypass directive: X-Devv-Cache: BYPASS over SSE');

  // -------------------------------------------------------------------------
  // TEST 5: Non-Streaming Invariant (Zero Regression for stream: false)
  // -------------------------------------------------------------------------
  console.log('\n5. Testing non-streaming (stream: false) backward compatibility...');
  const res5 = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Non-streaming probe test ${uniqueId}` }],
      stream: false,
    }),
  });

  assert.strictEqual(res5.status, 200);
  assert(res5.headers.get('content-type')?.includes('application/json'));
  const json5 = await res5.json();
  assert.strictEqual(json5.object, 'chat.completion');
  assert(json5.choices[0]?.message?.content);
  assert(json5._devv);
  console.log('   ✓ Non-streaming request works without regression (JSON returned with _devv envelope)');

  console.log('\n=== ALL 5 WIRE STREAMING & COMPATIBILITY CHECKS PASSED ===\n');
}

runTests().catch((err) => {
  console.error('\nWire test failed with error:', err);
  process.exit(1);
});
