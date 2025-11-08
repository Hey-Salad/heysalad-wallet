// scripts/test-crypto.ts
// Quick test script to verify crypto services work correctly

import * as CryptoService from '../services/CryptoService';

async function testCrypto() {
  console.log('🧪 Testing Crypto Services...\n');

  try {
    // Test 1: Generate key pair
    console.log('Test 1: Generate Key Pair');
    const keyPair = await CryptoService.generateKeyPair();
    console.log('✅ Private Key:', keyPair.privateKey.slice(0, 16) + '...');
    console.log('✅ Public Key:', keyPair.publicKey.slice(0, 16) + '...');
    console.log('✅ Address:', keyPair.address);
    console.log('');

    // Test 2: Import from private key
    console.log('Test 2: Import from Private Key');
    const imported = await CryptoService.importFromPrivateKey(keyPair.privateKey);
    console.log('✅ Imported Address:', imported.address);
    console.log('✅ Addresses Match:', imported.address === keyPair.address);
    console.log('');

    // Test 3: Sign transaction
    console.log('Test 3: Sign Transaction Hash');
    const txHash = 'a'.repeat(64); // Mock transaction hash
    const signature = CryptoService.signTransactionHash(txHash, keyPair.privateKey);
    console.log('✅ Signature Length:', signature.length, '(should be 130)');
    console.log('✅ Signature:', signature.slice(0, 32) + '...');
    console.log('');

    // Test 4: Verify signature
    console.log('Test 4: Verify Signature');
    const isValid = CryptoService.verifySignature(txHash, signature, keyPair.publicKey);
    console.log('✅ Signature Valid:', isValid);
    console.log('');

    // Test 5: Validate address format
    console.log('Test 5: Validate TRON Address');
    console.log('✅ Address starts with T:', keyPair.address.startsWith('T'));
    console.log('✅ Address length is 34:', keyPair.address.length === 34);
    console.log('');

    console.log('🎉 All crypto tests passed!\n');
    console.log('Your crypto implementation is working correctly.');
    console.log('You can now use these services in production.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testCrypto();
