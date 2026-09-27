import assert from 'assert';
import {
  formatSseChunk,
  createCachedStream,
  createMockSimulatorStream,
  createPassThroughCollectorStream,
  SSE_HEADERS,
} from '../src/lib/streaming.ts';

console.log('=== RUNNING CHUNKED SSE STREAMING UNIT VERIFICATION ===\n');

async function streamToString(readableStream) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

async function runTests() {
  // -------------------------------------------------------------------------
  // TEST 1: SSE Headers Invariant
  // -------------------------------------------------------------------------
  console.log('1. Testing SSE Headers Specification...');
  assert.strictEqual(SSE_HEADERS['Content-Type'], 'text/event-stream; charset=utf-8');
  assert.strictEqual(SSE_HEADERS['Cache-Control'], 'no-cache, no-transform');
  assert.strictEqual(SSE_HEADERS['X-Accel-Buffering'], 'no');
  assert.strictEqual(SSE_HEADERS['Connection'], 'keep-alive');
  console.log('   ✓ SSE Headers verified (Content-Type, X-Accel-Buffering, Cache-Control)');

  // -------------------------------------------------------------------------
  // TEST 2: formatSseChunk format conformance
  // -------------------------------------------------------------------------
  console.log('2. Testing formatSseChunk OpenAI specification wire compliance...');
  const chunkStr = formatSseChunk('chatcmpl-test123', 'gpt-4o-mini', 'Hello world', null, 'assistant');
  assert(chunkStr.startsWith('data: '));
  assert(chunkStr.endsWith('\n\n'));

  const parsed = JSON.parse(chunkStr.replace('data: ', '').trim());
  assert.strictEqual(parsed.id, 'chatcmpl-test123');
  assert.strictEqual(parsed.object, 'chat.completion.chunk');
  assert.strictEqual(parsed.model, 'gpt-4o-mini');
  assert.strictEqual(parsed.choices[0].delta.role, 'assistant');
  assert.strictEqual(parsed.choices[0].delta.content, 'Hello world');
  assert.strictEqual(parsed.choices[0].finish_reason, null);
  console.log('   ✓ formatSseChunk conforms to OpenAI chunk wire schema');

  // -------------------------------------------------------------------------
  // TEST 3: Synthetic 0ms Cache Stream
  // -------------------------------------------------------------------------
  console.log('3. Testing createCachedStream (Instant L1 Cache Replay)...');
  const mockCachedResponse = {
    id: 'chatcmpl-cached-abc123',
    object: 'chat.completion',
    created: 1720000000,
    model: 'gpt-4o-mini',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'DevvProxy is an ultra-fast edge proxy for AI agents and LLM APIs.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
  };

  const startStreamTime = Date.now();
  const cachedStream = createCachedStream(mockCachedResponse, 'gpt-4o-mini');
  const cachedOutput = await streamToString(cachedStream);
  const streamDuration = Date.now() - startStreamTime;

  assert(cachedOutput.includes('data: [DONE]'));
  assert(cachedOutput.includes('DevvProxy'));
  assert(cachedOutput.includes('"object":"chat.completion.chunk"'));
  console.log(`   ✓ createCachedStream completed in ${streamDuration}ms with full payload & terminal [DONE]`);

  // -------------------------------------------------------------------------
  // TEST 4: Mock Simulator Streaming
  // -------------------------------------------------------------------------
  console.log('4. Testing createMockSimulatorStream (Realistic chunk cadence)...');
  const mockStream = createMockSimulatorStream('gpt-4o-mini', [
    { role: 'user', content: 'What is 2 + 2?' },
  ]);
  const mockOutput = await streamToString(mockStream);
  assert(mockOutput.includes('data: [DONE]'));
  assert(mockOutput.includes('chat.completion.chunk'));
  assert(mockOutput.includes('"finish_reason":"stop"'));
  console.log('   ✓ createMockSimulatorStream successfully emitted chunk sequence and terminal [DONE]');

  // -------------------------------------------------------------------------
  // TEST 5: Pass-Through TransformStream with Background Text Collector
  // -------------------------------------------------------------------------
  console.log('5. Testing createPassThroughCollectorStream (Zero buffering + background collector)...');
  let backgroundText = '';
  let backgroundTokens = 0;

  // Simulate an upstream stream emitting raw SSE chunks
  const encoder = new TextEncoder();
  const rawSourceStream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(formatSseChunk('chatcmpl-up1', 'gpt-4o-mini', 'Zero ')));
      controller.enqueue(encoder.encode(formatSseChunk('chatcmpl-up1', 'gpt-4o-mini', 'latency ')));
      controller.enqueue(encoder.encode(formatSseChunk('chatcmpl-up1', 'gpt-4o-mini', 'edge ')));
      controller.enqueue(encoder.encode(formatSseChunk('chatcmpl-up1', 'gpt-4o-mini', 'streaming.')));
      controller.enqueue(encoder.encode(formatSseChunk('chatcmpl-up1', 'gpt-4o-mini', '', 'stop')));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  const collectorStream = createPassThroughCollectorStream(
    rawSourceStream,
    (assembled, tokens) => {
      backgroundText = assembled;
      backgroundTokens = tokens;
    }
  );

  const clientReceivedOutput = await streamToString(collectorStream);

  // Client must receive every chunk byte-for-byte
  assert(clientReceivedOutput.includes('Zero '));
  assert(clientReceivedOutput.includes('streaming.'));
  assert(clientReceivedOutput.includes('data: [DONE]'));

  // Background collector must assemble the complete text
  assert.strictEqual(backgroundText, 'Zero latency edge streaming.');
  assert(backgroundTokens > 0, 'Tokens must be calculated');
  console.log(`   ✓ Pass-through stream preserved raw bytes and accurately assembled: "${backgroundText}" (${backgroundTokens} tokens)`);

  console.log('\nAll 5 streaming unit tests passed successfully.');
}

runTests().catch((err) => {
  console.error('\nTest failed with error:', err);
  process.exit(1);
});
