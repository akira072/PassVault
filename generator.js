const Generator = (() => {
  const UPPER   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER   = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS  = '0123456789';
  const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  function secureRand(max) {
    const arr = new Uint32Array(1);
    let v;
    do { crypto.getRandomValues(arr); v = arr[0]; }
    while (v >= Math.floor(0xFFFFFFFF / max) * max);
    return v % max;
  }

  function generate(opts = {}) {
    const len     = opts.length  || 16;
    const upper   = opts.upper   !== false;
    const lower   = opts.lower   !== false;
    const digits  = opts.digits  !== false;
    const symbols = opts.symbols !== false;

    let pool = '';
    let req  = [];
    if (upper)   { pool += UPPER;   req.push(UPPER[secureRand(UPPER.length)]); }
    if (lower)   { pool += LOWER;   req.push(LOWER[secureRand(LOWER.length)]); }
    if (digits)  { pool += DIGITS;  req.push(DIGITS[secureRand(DIGITS.length)]); }
    if (symbols) { pool += SYMBOLS; req.push(SYMBOLS[secureRand(SYMBOLS.length)]); }
    if (!pool) pool = LOWER + DIGITS;

    let chars = [...req];
    for (let i = chars.length; i < len; i++) chars.push(pool[secureRand(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureRand(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  function initPopup(popupId, fabId) {
    const popup  = document.getElementById(popupId);
    const fab    = document.getElementById(fabId);
    if (!popup || !fab) return;

    const resultEl = popup.querySelector('#genResult');
    const slider   = popup.querySelector('#genLen');
    const lenVal   = popup.querySelector('#genLenVal');

    function regen() {
      const opts = {
        length:  parseInt(slider.value),
        upper:   popup.querySelector('#gUpper').checked,
        lower:   popup.querySelector('#gLower').checked,
        digits:  popup.querySelector('#gDigits').checked,
        symbols: popup.querySelector('#gSymbols').checked,
      };
      resultEl.textContent = generate(opts);
    }

    slider.addEventListener('input', () => { lenVal.textContent = slider.value; regen(); });
    popup.querySelectorAll('.gen-ck input').forEach(c => c.addEventListener('change', regen));
    popup.querySelector('#genRegenBtn').addEventListener('click', regen);
    popup.querySelector('#genCopyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(resultEl.textContent).then(() => UI.toast('Password copied', 'green'));
    });

    const useBtn = popup.querySelector('#genUseBtn');
    if (useBtn) useBtn.addEventListener('click', () => {
      const pw = resultEl.textContent;
      const pwField = document.getElementById('fPassword');
      if (pwField) {
        pwField.value = pw;
        pwField.type  = 'text';
        pwField.dispatchEvent(new Event('input'));
      }
      fab.click();
      UI.toast('Password inserted', 'green');
    });

    fab.addEventListener('click', () => {
      popup.classList.toggle('open');
      if (popup.classList.contains('open') && !resultEl.textContent) regen();
    });

    document.addEventListener('click', e => {
      if (!popup.contains(e.target) && !fab.contains(e.target)) popup.classList.remove('open');
    });

    return { generate: regen, getPassword: () => resultEl.textContent };
  }

  return { generate, initPopup };
})();
