/**
 * Encryption Utility for Backup Files
 * Uses AES-256-GCM with PBKDF2 key derivation
 */

/**
 * Derives a cryptographic key from a password using PBKDF2
 * @param {string} password - The password to derive the key from
 * @param {Uint8Array} salt - Random salt for key derivation
 * @returns {Promise<CryptoKey>} - The derived AES-GCM key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data with password using AES-256-GCM
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

  // Derive encryption key from password
  const key = await deriveKey(password, salt);

  // Convert data to JSON string and encode
  const encoder = new TextEncoder();
  const dataStr = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataStr);

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  );

  // Convert buffers to base64 for JSON serialization
  const encryptedArray = new Uint8Array(encryptedBuffer);

  return {
    encrypted: true,
    version: '1.0',
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2',
    iterations: 100000,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encryptedArray)
  };
}

/**
 * Decrypts encrypted backup data
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

  // Derive decryption key from password
  const key = await deriveKey(password, salt);

  try {
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
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
