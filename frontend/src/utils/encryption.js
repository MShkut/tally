/**
 * Encryption Utility for Backup Files
 * Uses AES-256-GCM with Argon2id key derivation (same algorithm family as the
 * server's login password hashing). Legacy backups encrypted with PBKDF2 can
 * still be decrypted.
 */

import { argon2id } from 'hash-wasm';

// Argon2id parameters for new backups. memorySize is in KiB (65536 = 64 MiB),
// matching the server's @node-rs/argon2 settings for login password hashing.
const ARGON2_ITERATIONS = 3;
const ARGON2_MEMORY_KIB = 65536;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32; // bytes, for AES-256

/**
 * Derives an AES-GCM key from a password using Argon2id
 * @param {string} password - The password to derive the key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @param {number} iterations - Argon2id time cost
 * @param {number} memorySize - Argon2id memory cost in KiB
 * @param {number} parallelism - Argon2id parallelism
 * @returns {Promise<CryptoKey>} - The derived AES-GCM key
 */
async function deriveKeyArgon2id(password, salt, iterations, memorySize, parallelism) {
  const keyBytes = await argon2id({
    password,
    salt,
    iterations,
    memorySize,
    parallelism,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: 'binary'
  });

  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Derives an AES-GCM key from a password using PBKDF2 (legacy backups only)
 * @param {string} password - The password to derive the key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @param {number} iterations - PBKDF2 iteration count
 * @returns {Promise<CryptoKey>} - The derived AES-GCM key
 */
async function deriveKeyPBKDF2(password, salt, iterations) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data with password using AES-256-GCM + Argon2id
 * @param {Object} data - The data object to encrypt
 * @param {string} password - The password to encrypt with
 * @returns {Promise<Object>} - Encrypted data structure with metadata
 */
export async function encryptData(data, password) {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM

  const key = await deriveKeyArgon2id(password, salt, ARGON2_ITERATIONS, ARGON2_MEMORY_KIB, ARGON2_PARALLELISM);

  // Convert data to JSON string and encode
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    dataBuffer
  );

  return {
    encrypted: true,
    version: '2.0',
    algorithm: 'AES-256-GCM',
    kdf: 'Argon2id',
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_KIB,
    parallelism: ARGON2_PARALLELISM,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(new Uint8Array(encryptedBuffer))
  };
}

/**
 * Decrypts encrypted backup data. Supports both current (Argon2id) and
 * legacy (PBKDF2) backups based on the `kdf` field.
 * @param {Object} encryptedData - The encrypted data structure
 * @param {string} password - The password to decrypt with
 * @returns {Promise<Object>} - The decrypted data object
 * @throws {Error} - If decryption fails (wrong password or corrupted data)
 */
export async function decryptData(encryptedData, password) {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  if (!encryptedData.encrypted) {
    throw new Error('Data is not encrypted');
  }

  if (encryptedData.algorithm !== 'AES-256-GCM') {
    throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
  }

  // Convert base64 strings back to Uint8Arrays
  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const encryptedBuffer = base64ToArrayBuffer(encryptedData.data);

  // Derive decryption key from password, matching whichever KDF this backup used
  const key = encryptedData.kdf === 'Argon2id'
    ? await deriveKeyArgon2id(password, salt, encryptedData.iterations, encryptedData.memorySize, encryptedData.parallelism)
    : await deriveKeyPBKDF2(password, salt, encryptedData.iterations || 100000);

  try {
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedBuffer
    );

    // Convert decrypted buffer to JSON object
    const decoder = new TextDecoder();
    const decryptedStr = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedStr);
  } catch (error) {
    // Decryption failure usually means wrong password
    if (error.name === 'OperationError') {
      throw new Error('Incorrect password or corrupted data');
    }
    throw error;
  }
}

/**
 * Checks if data is encrypted
 * @param {Object} data - The data to check
 * @returns {boolean} - True if data is encrypted
 */
export function isEncrypted(data) {
  return data && data.encrypted === true;
}

/**
 * Converts ArrayBuffer/Uint8Array to base64 string
 * @param {ArrayBuffer|Uint8Array} buffer - The buffer to convert
 * @returns {string} - Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 string to Uint8Array
 * @param {string} base64 - The base64 string to convert
 * @returns {Uint8Array} - The decoded buffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
