import assert from 'node:assert';
import { redactPII, isValidLuhn } from '../src/lib/pii-engine.ts';
import { generateCacheKey } from '../src/lib/cache-engine.ts';
import { generateMockCompletion } from '../src/lib/proxy-router.ts';

console.log('--- Starting DevvProxy Core Engine Test Suite ---');

// 1. Test Luhn Checksum with real 13-19 digit card numbers
console.log('Testing Luhn Algorithm...');
assert.strictEqual(isValidLuhn('4532118899223344'), false);   // invalid dummy (fails checksum)
assert.strictEqual(isValidLuhn('4111111111111111'), true);    // standard 16-digit Visa test card
assert.strictEqual(isValidLuhn('4532015112830366'), true);    // valid 16-digit test card
assert.strictEqual(isValidLuhn('0000000000000000'), false);   // repeated identical digits filtered
console.log('✓ Luhn Algorithm tests passed.');

// 2. Test PII Redaction Engine
console.log('Testing PII Redaction Engine...');
const sampleText = `
Hello, contact me at test.user@acme-corp.com or support@company.org.
My SSN is 123-45-6789 and my phone is +1 (555) 234-5678.
Payment card is 4111-1111-1111-1111 (valid Luhn).
Leaked token: sk-live_99887766554433221100aabbccddeeff.
`;

const piiResult = redactPII(sampleText);
console.log('Sanitized Text Preview:\n', piiResult.sanitizedText);
assert.strictEqual(piiResult.detectedTypes.includes('EMAIL'), true, 'Email must be detected');
assert.strictEqual(piiResult.detectedTypes.includes('SSN'), true, 'SSN must be detected');
assert.strictEqual(piiResult.detectedTypes.includes('PHONE'), true, 'Phone must be detected');
assert.strictEqual(piiResult.detectedTypes.includes('CREDIT_CARD'), true, 'Credit card must be detected');
assert.strictEqual(piiResult.detectedTypes.includes('SECRET_KEY'), true, 'Secret key must be detected');
assert.ok(piiResult.count >= 5, `Expected at least 5 redacted items, got ${piiResult.count}`);
console.log('✓ PII Redaction tests passed.');

// 3. Test ReDoS Protection (60KB string)
console.log('Testing ReDoS & Input Buffer Limits...');
const largeRepetitiveInput = 'a'.repeat(60000) + '@example.com';
const startTimer = Date.now();
const redosResult = redactPII(largeRepetitiveInput);
const duration = Date.now() - startTimer;
assert.ok(duration < 200, `Execution took ${duration}ms, must be < 200ms`);
console.log(`✓ ReDoS test passed in ${duration}ms.`);

// 4. Test Deterministic Cache Hashing & Canonical Sorting
console.log('Testing Deterministic Cache Hashing...');
const hash1 = generateCacheKey({
  keyId: 'key-123',
  model: 'gpt-4o-mini',
  rawMessages: [
    { role: 'user', content: 'What is capital of France?' }
  ],
  temperature: 0.7,
});

const hash2 = generateCacheKey({
  keyId: 'key-123',
  model: 'GPT-4O-MINI', // Case insensitivity
  rawMessages: [
    { role: 'user', content: '  What is capital of France?  ' } // Whitespace trimming
  ],
  temperature: 0.7,
});

assert.strictEqual(hash1, hash2, 'Identical canonical payloads must produce identical cache hashes');

const hashDifferentTenant = generateCacheKey({
  keyId: 'key-999', // Different tenant keyId
  model: 'gpt-4o-mini',
  rawMessages: [
    { role: 'user', content: 'What is capital of France?' }
  ],
  temperature: 0.7,
});

assert.notStrictEqual(hash1, hashDifferentTenant, 'Different tenants must NEVER share cache hashes');
console.log('✓ Deterministic Cache Hashing tests passed.');

// 5. Test Mock Simulator
console.log('Testing Mock Simulator Generator...');
const mockResponse = generateMockCompletion('gpt-4o-mini', [{ role: 'user', content: 'Hello' }], false);
assert.ok(mockResponse.id.startsWith('chatcmpl-devv-'));
assert.strictEqual(mockResponse.choices.length, 1);
assert.ok(mockResponse.usage.total_tokens > 0);
console.log('✓ Mock Simulator tests passed.');

console.log('\n=========================================');
console.log('ALL CORE ENGINE AUTOMATED TESTS PASSED! 🚀');
console.log('=========================================');
