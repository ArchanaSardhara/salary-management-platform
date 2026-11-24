import { createHash } from 'crypto';
import { generateToken, hashToken } from './token.util';

describe('token.util', () => {
  describe('generateToken', () => {
    it('returns a 128-character hex string (64 random bytes)', () => {
      expect(generateToken()).toMatch(/^[0-9a-f]{128}$/);
    });

    it('returns a different value on each call', () => {
      expect(generateToken()).not.toBe(generateToken());
    });
  });

  describe('hashToken', () => {
    it('returns the SHA-256 hex digest of the token', () => {
      const expected = createHash('sha256').update('abc').digest('hex');

      expect(hashToken('abc')).toBe(expected);
    });

    it('is deterministic and does not return the raw token', () => {
      const token = generateToken();

      expect(hashToken(token)).toBe(hashToken(token));
      expect(hashToken(token)).not.toBe(token);
    });
  });
});
