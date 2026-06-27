const CONFIG = {
  title: "Bowling Green Family Challenge",
  riddle: "Two dates guard our door. For each birthday, use the day, the month, and the two-digit year. Add those pieces together, then combine both dates to start.\n\nNow add the number where home begins.\n\nAdd kid one and kid two by age. Getting close, you may be.\n\nAdd the age when college began. Add the size of the first motorcycle. Add the year of the Corvette too.\n\nAlmost there.\n\nSubtract the letters in my childhood dog's name. Subtract where I rank, from 1 to 5, as the greatest brother of all time. Subtract the prime number with a biblical echo, somewhere between 1 and 150.\n\nEnter the final number.",
  hint: "Birthday rule: DD + MM + YY. Use only the first number of home, not the ZIP.",
  verifierIterations: 150000,
  verifierSaltB64: "z1yvzLKNtbgVEyOLlG8wAw==",
  verifierHashB64: "spXQZSsdkewckSw+Mi+3nqEaEPEpjZv6C+norQLxQs8=",
  keyIterations: 250000,
  keySaltB64: "DOGs7dq5xtQ5HbYPxILWSw==",
  rewardIvB64: "8wNDFJ9fRXj/Z1Y9",
  rewardCiphertextB64: "5pAKS+PpohxO6SHEU89U9tFqTtDunqJ/P0ncQBL4otxHSd138i/V6VLJQoFNW33/z+bLXLTn8nvHZ+EbnCPOFRRrGvdFI23k7OQPbaWUCN1I40/InggMjI4xAEqg0MoexTnP0qSINR05PkGAqrmKzj2oFZx5MeuxiHRIDycOQGWynMGgDC1AuyHuA3mtVIk=",
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
      statusEl.textContent = "That code did not unlock the redemption.";
      return;
    }

    const reward = await decryptReward(normalizedCode);
    rewardEl.textContent = reward;
    rewardPanel.hidden = false;
    venmoInput.focus();
    statusEl.textContent = "";
  } catch (error) {
    statusEl.textContent = "That code did not unlock the redemption.";
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
