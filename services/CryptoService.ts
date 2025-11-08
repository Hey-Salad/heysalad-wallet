// services/CryptoService.ts
// Production-grade cryptographic operations for TRON wallet

import * as elliptic from 'elliptic';
import * as crypto from 'expo-crypto';
import { keccak256 as keccakHash } from 'js-sha3';
import 'react-native-get-random-values';

const ec = new elliptic.ec('secp256k1');

export interface KeyPair {
  privateKey: string;
  publicKey: string;
  address: string;
}

/**
 * Generate a secure random private key
 * @returns 64-character hex string
 */
export async function generatePrivateKey(): Promise<string> {
  try {
    const randomBytes = await crypto.getRandomBytesAsync(32);
    const privateKey = Array.from(randomBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    console.log('[CryptoService] Generated secure private key');
    return privateKey;
  } catch (error) {
    console.error('[CryptoService] Failed to generate private key:', error);
    throw new Error('Failed to generate secure private key');
  }
}

/**
 * Validate private key format
 * @param privateKey - Hex string (with or without 0x prefix)
 * @returns true if valid
 */
export function isValidPrivateKey(privateKey: string): boolean {
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  return cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey);
}

/**
 * Derive public key from private key using ECDSA secp256k1
 * @param privateKey - 64-character hex string
 * @returns 130-character hex string (uncompressed public key without 04 prefix)
 */
export function getPublicKeyFromPrivate(privateKey: string): string {
  try {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    if (!isValidPrivateKey(cleanKey)) {
      throw new Error('Invalid private key format');
    }

    const keyPair = ec.keyFromPrivate(cleanKey, 'hex');
    const publicKey = keyPair.getPublic('hex');

    // Remove the '04' prefix from uncompressed public key
    return publicKey.slice(2);
  } catch (error) {
    console.error('[CryptoService] Failed to derive public key:', error);
    throw new Error('Failed to derive public key from private key');
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Perform Keccak-256 hash (proper implementation using js-sha3)
 */
function performKeccak256(data: Uint8Array): string {
  // Use proper Keccak-256 from js-sha3 library
  const hash = keccakHash(data);
  console.log('[CryptoService] Keccak-256 hash computed');
  return hash;
}

/**
 * Base58 encoding for TRON addresses
 */
function base58Encode(buffer: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let encoded = '';
  let num = BigInt('0x' + Array.from(buffer, b => b.toString(16).padStart(2, '0')).join(''));

  while (num > 0n) {
    const remainder = num % 58n;
    num = num / 58n;
    encoded = ALPHABET[Number(remainder)] + encoded;
  }

  // Add leading '1's for leading zeros
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    encoded = '1' + encoded;
  }

  return encoded;
}

/**
 * Derive TRON address from public key
 * @param publicKey - 130-character hex string (uncompressed, without 04 prefix)
 * @returns TRON address (T...)
 */
export async function getTronAddressFromPublicKey(publicKey: string): Promise<string> {
  try {
    // 1. Take Keccak-256 hash of public key
    const publicKeyBytes = hexToBytes(publicKey);
    const hash = performKeccak256(publicKeyBytes);

    // 2. Take last 20 bytes of hash
    const addressBytes = hexToBytes(hash.slice(-40));

    // 3. Add TRON prefix (0x41 for mainnet/testnet)
    const addressWithPrefix = new Uint8Array(21);
    addressWithPrefix[0] = 0x41;
    addressWithPrefix.set(addressBytes, 1);

    // 4. Double SHA-256 for checksum
    const hash1Hex = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      Array.from(addressWithPrefix, b => b.toString(16).padStart(2, '0')).join(''),
      { encoding: crypto.CryptoEncoding.HEX }
    );

    const hash2Hex = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      hash1Hex,
      { encoding: crypto.CryptoEncoding.HEX }
    );

    // 5. Take first 4 bytes as checksum
    const checksum = hexToBytes(hash2Hex.slice(0, 8));

    // 6. Append checksum to address
    const addressWithChecksum = new Uint8Array(25);
    addressWithChecksum.set(addressWithPrefix);
    addressWithChecksum.set(checksum, 21);

    // 7. Base58 encode
    const address = base58Encode(addressWithChecksum);

    console.log('[CryptoService] Derived TRON address:', address);
    return address;
  } catch (error) {
    console.error('[CryptoService] Failed to derive address:', error);
    throw new Error('Failed to derive TRON address');
  }
}

/**
 * Generate a complete key pair with address
 * @returns KeyPair object
 */
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    const privateKey = await generatePrivateKey();
    const publicKey = getPublicKeyFromPrivate(privateKey);
    const address = await getTronAddressFromPublicKey(publicKey);

    return {
      privateKey,
      publicKey,
      address
    };
  } catch (error) {
    console.error('[CryptoService] Failed to generate key pair:', error);
    throw new Error('Failed to generate key pair');
  }
}

/**
 * Import wallet from private key
 * @param privateKey - Hex string private key
 * @returns KeyPair object
 */
export async function importFromPrivateKey(privateKey: string): Promise<KeyPair> {
  try {
    if (!isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key format. Expected 64-character hex string.');
    }

    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const publicKey = getPublicKeyFromPrivate(cleanKey);
    const address = await getTronAddressFromPublicKey(publicKey);

    console.log('[CryptoService] Imported wallet successfully');
    return {
      privateKey: cleanKey,
      publicKey,
      address
    };
  } catch (error) {
    console.error('[CryptoService] Failed to import wallet:', error);
    throw error;
  }
}

/**
 * Sign transaction hash with private key using ECDSA
 * @param txHash - Transaction hash (32 bytes hex)
 * @param privateKey - Private key (64 bytes hex)
 * @returns Signature (65 bytes hex: r + s + v)
 */
export function signTransactionHash(txHash: string, privateKey: string): string {
  try {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const cleanHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;

    if (!isValidPrivateKey(cleanKey)) {
      throw new Error('Invalid private key format');
    }

    if (cleanHash.length !== 64) {
      throw new Error('Invalid transaction hash: must be 32 bytes (64 hex chars)');
    }

    // Create key pair from private key
    const keyPair = ec.keyFromPrivate(cleanKey, 'hex');

    // Sign the hash
    const signature = keyPair.sign(cleanHash, { canonical: true });

    // Get r, s, and recovery parameter
    const r = signature.r.toString('hex', 64);
    const s = signature.s.toString('hex', 64);
    const v = signature.recoveryParam!.toString(16).padStart(2, '0');

    // Combine into 65-byte signature
    const fullSignature = r + s + v;

    console.log('[CryptoService] Transaction signed successfully:', {
      signatureLength: fullSignature.length,
      format: 'r(32) + s(32) + v(1) bytes'
    });

    return fullSignature;
  } catch (error) {
    console.error('[CryptoService] Failed to sign transaction:', error);
    throw new Error('Failed to sign transaction');
  }
}

/**
 * Verify a signature
 * @param txHash - Transaction hash
 * @param signature - Signature to verify
 * @param publicKey - Public key to verify against
 * @returns true if valid
 */
export function verifySignature(
  txHash: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const cleanHash = txHash.startsWith('0x') ? txHash.slice(2) : txHash;
    const cleanSig = signature.startsWith('0x') ? signature.slice(2) : signature;
    const cleanPubKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;

    // Extract r, s from signature
    const r = cleanSig.slice(0, 64);
    const s = cleanSig.slice(64, 128);

    // Create signature object
    const sig = { r, s };

    // Get key from public key
    const key = ec.keyFromPublic('04' + cleanPubKey, 'hex');

    // Verify
    const isValid = key.verify(cleanHash, sig);

    console.log('[CryptoService] Signature verification:', isValid ? 'VALID' : 'INVALID');
    return isValid;
  } catch (error) {
    console.error('[CryptoService] Signature verification failed:', error);
    return false;
  }
}

export default {
  generatePrivateKey,
  isValidPrivateKey,
  getPublicKeyFromPrivate,
  getTronAddressFromPublicKey,
  generateKeyPair,
  importFromPrivateKey,
  signTransactionHash,
  verifySignature,
};
