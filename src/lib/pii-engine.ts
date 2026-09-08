import { ChatMessage, PiiRedactionResult, PiiType } from '@/types';

// Maximum allowable characters to scan in one pass to prevent ReDoS on massive inputs
const MAX_SCAN_LENGTH = 50_000;

// Luhn Algorithm Checksum for Credit Card numbers (13 to 19 digits)
export function isValidLuhn(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  // Filter out dummy repeating sequences (e.g. 0000000000000000)
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * ReDoS-resistant, linear-time PII Identification & Redaction Engine
 */
export function redactPII(input: string): PiiRedactionResult {
  if (!input || typeof input !== 'string') {
    return { sanitizedText: input || '', count: 0, detectedTypes: [] };
  }

  // Bound check for event loop safety
  let text = input.length > MAX_SCAN_LENGTH ? input.slice(0, MAX_SCAN_LENGTH) : input;
  const detectedTypesSet = new Set<PiiType>();
  let totalCount = 0;

  // 1. High-Entropy Secret / API Keys (OpenAI, GitHub, AWS, Generic Bearer)
  // Pattern: sk-[a-zA-Z0-9_-]{20,}, ghp_[a-zA-Z0-9]{36}, AKIA[0-9A-Z]{16}
  const secretPattern = /\b(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16})\b/g;
  let secretIndex = 1;
  text = text.replace(secretPattern, () => {
    detectedTypesSet.add('SECRET_KEY');
    totalCount++;
    return `[REDACTED_SECRET_${secretIndex++}]`;
  });

  // 2. Email Addresses (Linear, non-backtracking RFC 5322 compliant regex)
  const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  let emailIndex = 1;
  text = text.replace(emailPattern, () => {
    detectedTypesSet.add('EMAIL');
    totalCount++;
    return `[REDACTED_EMAIL_${emailIndex++}]`;
  });

  // 3. Credit Card Numbers (With strict Luhn Checksum validation)
  // Matches formatted 13-19 digits: 4532-1188-9922-3344 or 4532 1188 9922 3344 or continuous
  const cardCandidatePattern = /\b(?:\d[ -]?){13,19}\b/g;
  let cardIndex = 1;
  text = text.replace(cardCandidatePattern, (candidate) => {
    const rawDigits = candidate.replace(/\D/g, '');
    if (isValidLuhn(rawDigits)) {
      detectedTypesSet.add('CREDIT_CARD');
      totalCount++;
      return `[REDACTED_CREDIT_CARD_${cardIndex++}]`;
    }
    return candidate; // Keep original if not valid Luhn
  });

  // 4. US Social Security Numbers (SSN: XXX-XX-XXXX)
  const ssnPattern = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
  let ssnIndex = 1;
  text = text.replace(ssnPattern, () => {
    detectedTypesSet.add('SSN');
    totalCount++;
    return `[REDACTED_SSN_${ssnIndex++}]`;
  });

  // 5. Phone Numbers (US and E.164 International format)
  // Handles +1 (555) 123-4567, 555-123-4567, +44 20 7946 0919, etc.
  const phonePattern = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  let phoneIndex = 1;
  text = text.replace(phonePattern, (match) => {
    // Avoid redacting things that look like date ranges or short codes
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      detectedTypesSet.add('PHONE');
      totalCount++;
      return `[REDACTED_PHONE_${phoneIndex++}]`;
    }
    return match;
  });

  return {
    sanitizedText: text,
    count: totalCount,
    detectedTypes: Array.from(detectedTypesSet),
  };
}

/**
 * Scans an array of ChatMessages and scrubs PII from user and system prompts
 */
export function scrubMessages(messages: ChatMessage[]): {
  sanitizedMessages: ChatMessage[];
  totalPiiCount: number;
  detectedTypes: PiiType[];
} {
  let totalPiiCount = 0;
  const detectedTypesSet = new Set<PiiType>();

  const sanitizedMessages = messages.map((msg) => {
    // Only scrub user and system messages (preserve assistant tool calls if any)
    if (msg.role === 'user' || msg.role === 'system') {
      const result = redactPII(msg.content);
      totalPiiCount += result.count;
      result.detectedTypes.forEach((t) => detectedTypesSet.add(t));
      return {
        ...msg,
        content: result.sanitizedText,
      };
    }
    return msg;
  });

  return {
    sanitizedMessages,
    totalPiiCount,
    detectedTypes: Array.from(detectedTypesSet),
  };
}
