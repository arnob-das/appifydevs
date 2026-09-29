import { describe, it, expect } from 'vitest';
import { hashValue, compareValue } from '../src/common/utils/hash.util.js';

describe('Hash Utility (Bcrypt)', () => {
  const plain = 'SecurePassword@123';

  it('should hash a password with salt and return different hashes each time', async () => {
    const hash1 = await hashValue(plain);
    const hash2 = await hashValue(plain);

    expect(hash1).toBeDefined();
    expect(hash2).toBeDefined();
    expect(hash1).not.toBe(plain);
    expect(hash1).not.toBe(hash2);
  });

  it('should successfully verify matching password', async () => {
    const hash = await hashValue(plain);
    const isMatch = await compareValue(plain, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const hash = await hashValue(plain);
    const isMatch = await compareValue('WrongPassword@123', hash);
    expect(isMatch).toBe(false);
  });
});
