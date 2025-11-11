// DOM elements
const passwordOutput = document.getElementById('password-output');
const lengthInput = document.getElementById('length-input');
const lengthValue = document.getElementById('length-value');
const includeLower = document.getElementById('include-lower');
const includeUpper = document.getElementById('include-upper');
const includeNumbers = document.getElementById('include-numbers');
const includeSymbols = document.getElementById('include-symbols');
const excludeAmbiguous = document.getElementById('exclude-ambiguous');
const copyBtn = document.getElementById('copy-btn');
const generateBtn = document.getElementById('generate-btn');
const strengthIndicator = document.getElementById('strength-indicator');

// Character pools
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
// Commonly used safe symbol set
const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Characters that are often confused visually
const ambiguousSet = new Set(['O','0','o','I','l','1','S','5','B','8']);

function updateRangeFill() {
  const min = Number(lengthInput.min);
  const max = Number(lengthInput.max);
  const val = Number(lengthInput.value);
  const percent = ((val - min) * 100) / (max - min);
  lengthInput.style.background = `linear-gradient(90deg, var(--brand) ${percent}%, #2a335a ${percent}%)`;
}

function syncLengthLabel() {
  lengthValue.textContent = String(lengthInput.value);
  updateRangeFill();
}

function buildPool() {
  let pool = '';
  if (includeLower.checked) pool += lowercase;
  if (includeUpper.checked) pool += uppercase;
  if (includeNumbers.checked) pool += numbers;
  if (includeSymbols.checked) pool += symbols;

  if (excludeAmbiguous.checked && pool.length) {
    pool = Array.from(pool).filter(ch => !ambiguousSet.has(ch)).join('');
  }

  // If user unchecks everything, default to lowercase to avoid empty pool
  if (!pool) pool = lowercase;
  return pool;
}

function getRandomInt(maxExclusive) {
  // Use crypto for better randomness
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % maxExclusive;
}

function shuffleString(str) {
  const arr = Array.from(str);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function generatePassword() {
  const len = Number(lengthInput.value);
  const pool = buildPool();

  // Ensure at least one character from each selected category
  const required = [];
  if (includeLower.checked) required.push(lowercase[getRandomInt(lowercase.length)]);
  if (includeUpper.checked) required.push(uppercase[getRandomInt(uppercase.length)]);
  if (includeNumbers.checked) required.push(numbers[getRandomInt(numbers.length)]);
  if (includeSymbols.checked) {
    const symSet = excludeAmbiguous.checked ? Array.from(symbols).filter(c => !ambiguousSet.has(c)).join('') : symbols;
    if (symSet.length) required.push(symSet[getRandomInt(symSet.length)]);
  }

  let result = required.join('');
  for (let i = result.length; i < len; i++) {
    result += pool[getRandomInt(pool.length)];
  }

  result = shuffleString(result);
  passwordOutput.value = result;
  updateStrength(result);
}

function estimateEntropyBits(password) {
  if (!password) return 0;
  let charsetSize = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const hasSym = /[^A-Za-z0-9]/.test(password);

  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasNum) charsetSize += 10;
  if (hasSym) charsetSize += 32; // rough estimate

  const bits = Math.log2(charsetSize) * password.length;
  return isFinite(bits) ? bits : 0;
}

function updateStrength(pw) {
  const bits = estimateEntropyBits(pw);
  let level = 'weak';
  let label = 'Weak';
  if (bits >= 60 && bits < 80) { level = 'fair'; label = 'Fair'; }
  else if (bits >= 80) { level = 'strong'; label = 'Strong'; }
  strengthIndicator.dataset.level = level;
  strengthIndicator.textContent = label;
}

async function copyPassword() {
  const value = passwordOutput.value;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    flashCopyFeedback('Copied');
  } catch {
    // Fallback for older browsers
    passwordOutput.select();
    document.execCommand('copy');
    flashCopyFeedback('Copied');
  }
}

function flashCopyFeedback(text) {
  const original = copyBtn.textContent;
  copyBtn.textContent = text;
  copyBtn.disabled = true;
  setTimeout(() => {
    copyBtn.textContent = original;
    copyBtn.disabled = false;
  }, 900);
}

// Wire up events
lengthInput.addEventListener('input', () => {
  syncLengthLabel();
});

generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyPassword);

// Initialize UI
syncLengthLabel();
updateStrength('');
generatePassword();


