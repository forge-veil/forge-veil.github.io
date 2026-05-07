import { pipeline, type TextGenerationPipeline } from '@huggingface/transformers';
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm';
import type { AttestationQuote, ResponseReceipt } from '../lib/attestation';

type Engine = 'transformers' | 'webllm';

let privateKey: CryptoKey;
let publicKeyRaw: CryptoKey;
let pubkeyBase64: string;
let mrenclave: string;
let currentEngine: Engine;
let tfGenerator: TextGenerationPipeline | null = null;
let webllmEngine: MLCEngine | null = null;

// ── Worker message router ────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data;
  if (type === 'init') await boot(e.data.engine as Engine);
  if (type === 'query') await handleQuery(e.data.text as string);
};

// ── Boot sequence ─────────────────────────────────────────────────────────────

async function boot(engine: Engine) {
  currentEngine = engine;

  // Step 1: generate keypair
  postMessage({ type: 'boot-step', step: 1, label: 'Generating ECDSA P-256 keypair…' });
  const keypair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify']
  );
  privateKey = keypair.privateKey;
  publicKeyRaw = keypair.publicKey;
  const pubkeyBuf = await crypto.subtle.exportKey('spki', publicKeyRaw);
  pubkeyBase64 = btoa(String.fromCharCode(...new Uint8Array(pubkeyBuf)));

  // Step 2: self-measure
  postMessage({ type: 'boot-step', step: 2, label: 'Hashing Worker source (SHA-256)…' });
  const sourceText = await fetch(self.location.href).then((r) => r.text());
  const hashBuf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(sourceText)
  );
  mrenclave = btoa(String.fromCharCode(...new Uint8Array(hashBuf)));

  // Step 3: sign quote
  postMessage({ type: 'boot-step', step: 3, label: 'Signing attestation quote…' });
  const timestamp = Date.now();
  const quotePayload = new TextEncoder().encode(
    `${mrenclave}|${pubkeyBase64}|${timestamp}`
  );
  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    quotePayload
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  const quote: AttestationQuote = { mrenclave, pubkey: pubkeyBase64, timestamp, signature };
  postMessage({ type: 'quote', quote });

  // Step 4: load model (implemented in Tasks 4 and 5)
  postMessage({ type: 'boot-step', step: 4, label: 'Loading model weights…' });
  await loadModel(engine);
  postMessage({ type: 'ready' });
}

async function loadModel(engine: Engine) {
  if (engine === 'transformers') {
    tfGenerator = await pipeline(
      'text-generation',
      'HuggingFaceTB/SmolLM2-135M-Instruct',
      {
        dtype: 'q4',
        progress_callback: (p: { status: string; progress?: number }) => {
          if (p.status === 'progress' && p.progress !== undefined) {
            postMessage({ type: 'model-progress', progress: Math.round(p.progress) });
          }
        },
      }
    );
  } else if (engine === 'webllm') {
    webllmEngine = await CreateMLCEngine('Llama-3.2-1B-Instruct-q4f16_1-MLC', {
      initProgressCallback: (report: { progress: number; text: string }) => {
        postMessage({
          type: 'model-progress',
          progress: Math.round(report.progress * 100),
          label: report.text,
        });
      },
    });
  }
}

// ── Query handler ─────────────────────────────────────────────────────────────

async function handleQuery(queryText: string) {
  let responseText: string;

  if (currentEngine === 'transformers' && tfGenerator) {
    const result = await tfGenerator(
      [
        { role: 'system', content: 'You are a helpful assistant explaining trusted execution environments and security concepts. Be concise.' },
        { role: 'user', content: queryText },
      ],
      { max_new_tokens: 256 }
    );
    const output = result as Array<{ generated_text: Array<{ role: string; content: string }> }>;
    responseText = output[0].generated_text.at(-1)?.content ?? '(no response)';
  } else if (currentEngine === 'webllm' && webllmEngine) {
    const reply = await webllmEngine.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant explaining trusted execution environments and security concepts. Be concise.' },
        { role: 'user', content: queryText },
      ],
      max_tokens: 256,
    });
    responseText = reply.choices[0].message.content ?? '(no response)';
  } else {
    responseText = '(engine not ready)';
  }

  const receipt = await signReceipt(queryText, responseText);
  postMessage({ type: 'response', text: responseText, receipt });
}

// ── Receipt signing ───────────────────────────────────────────────────────────

async function signReceipt(queryText: string, responseText: string): Promise<ResponseReceipt> {
  const queryHash = await sha256base64(queryText);
  const responseHash = await sha256base64(responseText);
  const timestamp = Date.now();
  const payload = new TextEncoder().encode(`${queryHash}|${responseHash}|${timestamp}`);
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, payload);
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return { queryHash, responseHash, timestamp, signature };
}

async function sha256base64(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
