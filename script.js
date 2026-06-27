const CONFIG = {
  title: "Bowling Green Family Challenge",
  riddle: "Two dates guard our door.\n\nFor each birthday, use the day, the month, and the two-digit year.\nAdd those pieces together, then combine both dates to start.\n\nAdd the number where home begins.\nAdd kid one's age.\nAdd kid two's age.\nAdd the age when college began.\nAdd the size of the first motorcycle.\nAdd the year of the Corvette.\n\nAlmost there.\n\nSubtract the letters in my childhood dog's name.\nSubtract where I rank, from 1 to 5, as the greatest brother of all time.\nSubtract the prime number with a biblical echo, somewhere between 1 and 150.\n\nEnter the final number.",
  hint: "Birthday rule: DD + MM + YY. Use only the first number of home, not the ZIP.",
  verifierIterations: 150000,
  verifierSaltB64: "YOjkrNGXdjPMP/ZGcQ/QMQ==",
  verifierHashB64: "3mle8InJV/6iGKKqFgXubqp9W6VJWd0sIWYczg4uJRM=",
  keyIterations: 250000,
  keySaltB64: "IWQJVt1ah29blCWLTv2hmw==",
  rewardIvB64: "FtEamfHr2PgsnSoT",
  rewardCiphertextB64: "8wWfZRB+wAoHPxSG2m4nt9H/sD6GkIQ95J2d7G02hPESmNUCpyeYv9ZTjB3VhIc7Kba64cLoVbbpotggVCpWlIbqyhALqLYgPTXXq7L7wMAaRZ14BSOLUtiVB9MxUpfKHa0gTBOpV98xt+5/YB772jqTgc58XN+sKhGwzHkgG0HuwMXRaDgnwnSdrGrUQoGJ",
  redemptionEmail: "Brandonm@psix.ai",
  claimCode: "BOWLINGGREEN-8909"
};

const form = document.querySelector("#unlock-form");
const venmoForm = document.querySelector("#venmo-form");
const codeInput = document.querySelector("#code");
const venmoInput = document.querySelector("#venmo-id");
const statusEl = document.querySelector("#status");
const venmoStatusEl = document.querySelector("#venmo-status");
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
      statusEl.textContent = "try again dumbass";
      return;
    }

    const reward = await decryptReward(normalizedCode);
    rewardEl.textContent = reward;
    rewardPanel.hidden = false;
    venmoInput.focus();
    statusEl.textContent = "";
  } catch (error) {
    statusEl.textContent = "try again dumbass";
  } finally {
    button.disabled = false;
  }
});

venmoForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const venmoId = venmoInput.value.trim();
  if (!venmoId) {
    venmoStatusEl.textContent = "Enter a Venmo username to send the claim.";
    return;
  }

  const subject = `${CONFIG.title} redemption claim`;
  const body = [
    "A Bowling Green Family Challenge redemption was submitted.",
    "",
    `Venmo ID: ${venmoId}`,
    `Claim code: ${CONFIG.claimCode}`,
    "Prize: $50",
    `Submitted: ${new Date().toLocaleString()}`,
    `Page: ${window.location.href}`
  ].join("\n");

  const mailto = `mailto:${encodeURIComponent(CONFIG.redemptionEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  venmoStatusEl.textContent = "Your email app should open. Tap Send to finish the claim.";
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
