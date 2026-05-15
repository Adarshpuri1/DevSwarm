// backend/utils/openrouter.js
// OpenRouter API client with automatic retry + free-model fallback chain

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_ALLOW_INSECURE_TLS = process.env.OPENROUTER_ALLOW_INSECURE_TLS === 'true';

let insecureTlsConfigured = false;

function maybeEnableInsecureTls() {
  if (OPENROUTER_ALLOW_INSECURE_TLS && !insecureTlsConfigured) {
    // Development-only escape hatch for corporate MITM/self-signed cert chains.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    insecureTlsConfigured = true;
    console.warn('[OpenRouter] OPENROUTER_ALLOW_INSECURE_TLS=true: TLS certificate verification disabled for this process');
  }
}

// Free models tried in order — if one is rate-limited, the next is tried
const FREE_MODELS = [
  'deepseek/deepseek-chat'
];

const MAX_RETRIES = 3;   // retries per model before moving to next
const BASE_DELAY_MS = 3000; // base wait between retries (multiplied per retry)

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call one model, with up to MAX_RETRIES on 429.
 * Returns { ok: true, data } or { ok: false, retryAfter }
 */
async function tryModel({ model, max_tokens, system, messages }) {
  maybeEnableInsecureTls();

  const chatMessages = [];
  if (system) chatMessages.push({ role: 'system', content: system });
  for (const msg of messages) chatMessages.push({ role: msg.role, content: msg.content });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[OpenRouter] Trying model=${model} attempt=${attempt}/${MAX_RETRIES}`);

    let response;
    try {
      response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://devswarm.app',
          'X-Title': 'DevSwarm',
        },
        body: JSON.stringify({ model, max_tokens, messages: chatMessages }),
      });
    } catch (err) {
      const tlsCode = err?.cause?.code || err?.code;
      if (tlsCode === 'SELF_SIGNED_CERT_IN_CHAIN') {
        throw new Error(
          'TLS validation failed (self-signed certificate in chain). ' +
          'Preferred fix: trust your corporate CA using NODE_EXTRA_CA_CERTS. ' +
          'Temporary local workaround: set OPENROUTER_ALLOW_INSECURE_TLS=true.'
        );
      }
      throw err;
    }

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      return { ok: true, text };
    }

    // Parse error body
    let errBody = {};
    try { errBody = await response.json(); } catch (_) {}

    if (response.status === 429) {
      // Honor the Retry-After hint from OpenRouter if present
      const retryAfter = errBody?.error?.metadata?.retry_after_seconds ?? attempt * (BASE_DELAY_MS / 1000);
      const waitMs = Math.ceil(retryAfter * 1000) + 500; // add small buffer
      console.warn(`[OpenRouter] 429 on ${model} — waiting ${waitMs}ms before retry ${attempt}/${MAX_RETRIES}`);

      if (attempt < MAX_RETRIES) {
        await sleep(waitMs);
        continue; // retry same model
      } else {
        // Exhausted retries for this model
        return { ok: false, status: 429, model };
      }
    }

    // Non-429 error — don't retry this model
    const msg = errBody?.error?.message ?? response.statusText;
    throw new Error(`OpenRouter API error ${response.status}: ${msg}`);
  }
}

/**
 * Public API — same signature as the old createMessage.
 * Tries each free model in sequence until one succeeds.
 */
async function createMessage({ max_tokens = 1000, system, messages }) {
  for (const model of FREE_MODELS) {
    const result = await tryModel({ model, max_tokens, system, messages });

    if (result.ok) {
      console.log(`[OpenRouter] ✅ Success with model=${model}`);
      // Return Anthropic-compatible shape: { content: [{ text }] }
      return { content: [{ text: result.text }] };
    }

    // 429 exhausted for this model — try next
    console.warn(`[OpenRouter] ⚠️  All retries exhausted for ${model}, trying next model...`);
  }

  throw new Error(
    'All OpenRouter free models are currently rate-limited. ' +
    'Please wait a minute and try again, or add your own key at https://openrouter.ai/settings/integrations'
  );
}

module.exports = { createMessage, FREE_MODELS };
