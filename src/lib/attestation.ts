export interface AttestationQuote {
  mrenclave: string;
  pubkey: string;
  timestamp: number;
  signature: string;
}

export interface ResponseReceipt {
  queryHash: string;
  responseHash: string;
  timestamp: number;
  signature: string;
}

export interface EnclaveState {
  status: 'idle' | 'booting' | 'attesting' | 'loading-model' | 'ready' | 'error';
  quote?: AttestationQuote;
  pubkey?: CryptoKey;
  mrenclave?: string;
  verified: boolean;
  engine?: 'transformers' | 'webllm';
  queryCount: number;
  validReceipts: number;
}

export async function sha256base64(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function importPublicKey(pubkeyBase64: string): Promise<CryptoKey> {
  try {
    const bytes = Uint8Array.from(atob(pubkeyBase64), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'spki',
      bytes,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
  } catch {
    throw new Error('importPublicKey: invalid base64 or non-SPKI key');
  }
}

export async function verifyQuote(quote: AttestationQuote, pubkey: CryptoKey): Promise<boolean> {
  try {
    const payload = new TextEncoder().encode(
      `${quote.mrenclave}|${quote.pubkey}|${quote.timestamp}`
    );
    const sig = Uint8Array.from(atob(quote.signature), (c) => c.charCodeAt(0));
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubkey, sig, payload);
  } catch {
    return false;
  }
}

export async function verifyReceipt(receipt: ResponseReceipt, pubkey: CryptoKey): Promise<boolean> {
  try {
    const payload = new TextEncoder().encode(
      `${receipt.queryHash}|${receipt.responseHash}|${receipt.timestamp}`
    );
    const sig = Uint8Array.from(atob(receipt.signature), (c) => c.charCodeAt(0));
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubkey, sig, payload);
  } catch {
    return false;
  }
}
