import { describe, it, expect } from 'vitest';
import {
  encryptText,
  decryptText,
  maskApiKey,
} from '../src/common/utils/crypto.util.js';

describe('Crypto Utility (AES-256-GCM)', () => {
  const sampleKey = 'sk-proj-1234567890abcdef1234567890abcdef';

  it('should encrypt and decrypt a plaintext API key correctly', () => {
    const encrypted = encryptText(sampleKey);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(sampleKey);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(sampleKey);
  });

  it('should return empty string when encrypting empty text', () => {
    expect(encryptText('')).toBe('');
  });

  it('should mask API keys for safe display in responses', () => {
    const masked = maskApiKey(sampleKey);
    expect(masked).toBe('sk-p...cdef');
    expect(masked).not.toContain(sampleKey.slice(5, 20));
  });

  it('should handle short strings in maskApiKey', () => {
    expect(maskApiKey('1234')).toBe('********');
  });
});
