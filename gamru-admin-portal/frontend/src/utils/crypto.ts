/**
 * Reversible password obfuscation for the login payload.
 *
 * The plaintext password is never put on the wire. We AES-256-GCM encrypt it
 * with a shared secret; the backend decrypts it and then runs its normal
 * bcrypt comparison. Output format: `enc:v1:<base64(iv(12) + ciphertext+tag)>`.
 */

const SECRET: string =
  (import.meta.env.VITE_PASSWORD_SECRET as string | undefined) ||
  'gamru-engage-shared-password-secret';

const ENC_PREFIX = 'enc:v1:';

const toBase64 = (bytes: Uint8Array): string => {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

const deriveKey = async (): Promise<CryptoKey> => {
  const secretBytes = new TextEncoder().encode(SECRET);
  const hash = await crypto.subtle.digest('SHA-256', secretBytes); // 32-byte key
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt']);
};

/**
 * Encrypt a password for transport. Returns a prefixed, base64 string the
 * backend recognises and decrypts.
 */
export const encryptPassword = async (plain: string): Promise<string> => {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );

  const cipherBytes = new Uint8Array(cipher); // ciphertext + 16-byte auth tag
  const packed = new Uint8Array(iv.length + cipherBytes.length);
  packed.set(iv, 0);
  packed.set(cipherBytes, iv.length);

  return ENC_PREFIX + toBase64(packed);
};
