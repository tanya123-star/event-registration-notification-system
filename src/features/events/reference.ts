import { randomBytes } from "node:crypto";

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Creates an opaque, human-readable registration reference with 80 bits of entropy.
 *
 * The reference is safe to encode in a QR code and does not contain student data.
 */
export function createRegistrationReference(): string {
  const bytes = randomBytes(10);
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += CROCKFORD_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  return `KASAMA-${output}`;
}
