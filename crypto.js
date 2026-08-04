const Crypto = (() => {
  const ENC = new TextEncoder();
  const DEC = new TextDecoder();

  async function deriveKey(masterPass, salt) {
    const km = await crypto.subtle.importKey('raw', ENC.encode(masterPass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
      km,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  function toB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
  function fromB64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }

  async function encrypt(plaintext, masterPass) {
    const salt      = crypto.getRandomValues(new Uint8Array(16));
    const iv        = crypto.getRandomValues(new Uint8Array(12));
    const key       = await deriveKey(masterPass, salt);
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, ENC.encode(plaintext));
    const combined  = new Uint8Array(16 + 12 + cipherBuf.byteLength);
    combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(cipherBuf), 28);
    return toB64(combined.buffer);
  }

  async function decrypt(b64, masterPass) {
    const combined = fromB64(b64);
    const salt     = combined.slice(0, 16);
    const iv       = combined.slice(16, 28);
    const cipher   = combined.slice(28);
    const key      = await deriveKey(masterPass, salt);
    const plain    = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return DEC.decode(plain);
  }

  return { encrypt, decrypt };
})();
