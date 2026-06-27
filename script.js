const CONFIG = {
  title: "Bowling Green Family Challenge",
  riddle: "This answer is not hiding online. Start with Dad's birthday month and day, then Mom's birthday month and day, then the loyal four-legged friend the family remembers. Use this format: MMDD-MMDD-name",
  hint: "No years. Lowercase the name. Example format: 0101-1231-name",
  verifierIterations: 150000,
  verifierSaltB64: "MjI3i6kr53eBtAvW2JXb2A==",
  verifierHashB64: "2jpLjroSzaJXaXJwpIugfYUHdhGShgOrrAOjbiY9tqk=",
  keyIterations: 250000,
  keySaltB64: "+iwIaNAXZB8ZZ6NLy8bFMw==",
  rewardIvB64: "XzXaY84WEX9jaFhu",
  rewardCiphertextB64: "9UEjvdzw3gSS+QToSxuUOcGO/b6LA45JsBrreB8GqVbNKTiyWZmwKYbBsWrJsN/sGbU+IKhufojIwWUyPybycBmNh5DO2jUwkE0xrXlknDQmyjbkNx2M7KzXWVQi03vupRcvpfeEiIGbIdh5du6/S5nJgm5byDRLPqKbNl0lYKxOrjjD3w=="
};

const form = document.querySelector("#unlock-form");
const codeInput = document.querySelector("#code");
const statusEl = document.querySelector("#status");
const rewardPanel = document.querySelector("#reward-panel");
const rewardEl = document.querySelector("#reward");
const riddleEl = document.querySelector("#riddle");
const hintEl = document.querySelector("#hint");
const titleEl = document.querySelector("#page-title");

titleEl.textContent = CONFIG.title;
document.title = CONFIG.title;
riddleEl.textContent = CONFIG.riddle;

if (CONFIG.hint) {
  hintEl.textContent = CONFIG.hint;
  hintEl.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "";
  rewardPanel.hidden = true;

  const button = form.querySelector("button");
  button.disabled = true;

  try {
    const normalizedCode = normalizeCode(codeInput.value);
    if (!normalizedCode) {
      statusEl.textContent = "Enter a code to continue.";
      return;
    }

    const isValid = await verifyCode(normalizedCode);
    if (!isValid) {
      statusEl.textContent = "That code did not unlock the redemption.";
      return;
    }

    const reward = await decryptReward(normalizedCode);
    rewardEl.textContent = reward;
    rewardPanel.hidden = false;
    statusEl.textContent = "";
  } catch (error) {
    statusEl.textContent = "That code did not unlock the redemption.";
  } finally {
    button.disabled = false;
  }
});

function normalizeCode(value) {
  return value.trim().toLowerCase();
}

async function verifyCode(code) {
  const hash = await pbkdf2Hash(
    code,
    base64ToBytes(CONFIG.verifierSaltB64),
    CONFIG.verifierIterations
  );
  return constantTimeEqual(hash, base64ToBytes(CONFIG.verifierHashB64));
}

async function decryptReward(code) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBytes(CONFIG.keySaltB64),
      iterations: CONFIG.keyIterations
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(CONFIG.rewardIvB64)
    },
    key,
    base64ToBytes(CONFIG.rewardCiphertextB64)
  );

  return new TextDecoder().decode(plaintext);
}

async function pbkdf2Hash(code, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(code),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    keyMaterial,
    256
  );

  return new Uint8Array(bits);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}
