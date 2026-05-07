import { describe, it, expect } from 'vitest';
import {
  importPublicKey,
  verifyQuote,
  verifyReceipt,
  sha256base64,
} from './attestation';
import type { AttestationQuote, ResponseReceipt } from './attestation';

// Helper: generate a real ECDSA keypair for tests
async function makeKeypair() {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
}

async function exportPubkeyBase64(key: CryptoKey): Promise<string> {
  const buf = await crypto.subtle.exportKey('spki', key);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function signBase64(payload: string, privateKey: CryptoKey): Promise<string> {
  const buf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(payload)
  );
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

describe('sha256base64', () => {
  it('returns a non-empty base64 string', async () => {
    const result = await sha256base64('hello');
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('is deterministic', async () => {
    expect(await sha256base64('hello')).toBe(await sha256base64('hello'));
  });

  it('differs for different inputs', async () => {
    expect(await sha256base64('hello')).not.toBe(await sha256base64('world'));
  });
});

describe('importPublicKey', () => {
  it('returns a CryptoKey from a valid base64 SPKI', async () => {
    const { publicKey } = await makeKeypair();
    const b64 = await exportPubkeyBase64(publicKey);
    const imported = await importPublicKey(b64);
    expect(imported.type).toBe('public');
  });
});

describe('verifyQuote', () => {
  it('returns true for a valid quote', async () => {
    const { publicKey, privateKey } = await makeKeypair();
    const pubkey = await exportPubkeyBase64(publicKey);
    const mrenclave = await sha256base64('worker-source');
    const timestamp = 1000000;
    const signature = await signBase64(`${mrenclave}|${pubkey}|${timestamp}`, privateKey);
    const quote: AttestationQuote = { mrenclave, pubkey, timestamp, signature };
    expect(await verifyQuote(quote, publicKey)).toBe(true);
  });

  it('returns false if mrenclave is tampered', async () => {
    const { publicKey, privateKey } = await makeKeypair();
    const pubkey = await exportPubkeyBase64(publicKey);
    const mrenclave = await sha256base64('worker-source');
    const timestamp = 1000000;
    const signature = await signBase64(`${mrenclave}|${pubkey}|${timestamp}`, privateKey);
    const quote: AttestationQuote = { mrenclave: 'tampered', pubkey, timestamp, signature };
    expect(await verifyQuote(quote, publicKey)).toBe(false);
  });

  it('returns false if signature is tampered', async () => {
    const { publicKey } = await makeKeypair();
    const pubkey = await exportPubkeyBase64(publicKey);
    const mrenclave = await sha256base64('worker-source');
    const timestamp = 1000000;
    const quote: AttestationQuote = { mrenclave, pubkey, timestamp, signature: 'AAAA' };
    expect(await verifyQuote(quote, publicKey)).toBe(false);
  });
});

describe('verifyReceipt', () => {
  it('returns true for a valid receipt', async () => {
    const { publicKey, privateKey } = await makeKeypair();
    const queryHash = await sha256base64('what is a TEE?');
    const responseHash = await sha256base64('A TEE is...');
    const timestamp = 1000001;
    const signature = await signBase64(`${queryHash}|${responseHash}|${timestamp}`, privateKey);
    const receipt: ResponseReceipt = { queryHash, responseHash, timestamp, signature };
    expect(await verifyReceipt(receipt, publicKey)).toBe(true);
  });

  it('returns false if responseHash is tampered', async () => {
    const { publicKey, privateKey } = await makeKeypair();
    const queryHash = await sha256base64('what is a TEE?');
    const responseHash = await sha256base64('A TEE is...');
    const timestamp = 1000001;
    const signature = await signBase64(`${queryHash}|${responseHash}|${timestamp}`, privateKey);
    const receipt: ResponseReceipt = { queryHash, responseHash: 'tampered', timestamp, signature };
    expect(await verifyReceipt(receipt, publicKey)).toBe(false);
  });
});
