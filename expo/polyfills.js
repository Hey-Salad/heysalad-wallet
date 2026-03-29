// Import polyfills for Node.js core modules
import 'react-native-get-random-values'; // Must be first
import { Buffer } from 'buffer';
import process from 'process';

// Make them globally available
global.Buffer = Buffer;
global.process = process;

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
