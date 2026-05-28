import {
  FREE_GENERATION_LIMIT,
  getUsageState,
  canGenerate,
  recordSuccessfulGeneration,
  resetUsageForDev,
  setLocalPremiumUnlockedForDev,
} from "./localDb.js";

export {
  FREE_GENERATION_LIMIT,
  getUsageState,
  canGenerate,
  recordSuccessfulGeneration,
  resetUsageForDev,
  setLocalPremiumUnlockedForDev,
};

export function remainingFromState(state) {
  if (!state) return FREE_GENERATION_LIMIT;
  if (state.isLocalPremiumUnlocked) return Infinity;
  const remaining = state.freeGenerationLimit - state.successfulGenerationCount;
  return remaining < 0 ? 0 : remaining;
}

export function usageCopyFromState(state) {
  if (!state) {
    return {
      text: `${FREE_GENERATION_LIMIT} free homemade creations included`,
      tone: "ok",
      remaining: FREE_GENERATION_LIMIT,
      blocked: false,
    };
  }
  if (state.isLocalPremiumUnlocked) {
    return {
      text: "Developer unlock active — unlimited creations on this device",
      tone: "unlocked",
      remaining: Infinity,
      blocked: false,
    };
  }
  const remaining = remainingFromState(state);
  if (remaining <= 0) {
    return {
      text: "You’ve used your 10 free creations. Upgrade to keep going.",
      tone: "blocked",
      remaining: 0,
      blocked: true,
    };
  }
  if (remaining === 1) {
    return {
      text: "1 free creation left",
      tone: "warn",
      remaining,
      blocked: false,
    };
  }
  if (remaining <= 3) {
    return {
      text: `${remaining} free creations left`,
      tone: "warn",
      remaining,
      blocked: false,
    };
  }
  return {
    text: `${remaining} free creations left`,
    tone: "ok",
    remaining,
    blocked: false,
  };
}

const TONE_CLASS = {
  warn: "is-warn",
  blocked: "is-blocked",
  unlocked: "is-unlocked",
};

export function applyUsageCopyToStrip(strip, copy) {
  if (!strip) return;
  strip.textContent = copy.text;
  strip.classList.remove("is-warn", "is-blocked", "is-unlocked");
  if (TONE_CLASS[copy.tone]) strip.classList.add(TONE_CLASS[copy.tone]);
  strip.hidden = false;
}

export async function refreshUsageStrips() {
  const state = await getUsageState();
  const copy = usageCopyFromState(state);
  document.querySelectorAll("[data-usage-strip], #manual-usage-strip, #result-usage-strip").forEach((el) => {
    applyUsageCopyToStrip(el, copy);
  });
  const homeStrip = document.getElementById("home-usage-strip");
  if (homeStrip) {
    if (state.isLocalPremiumUnlocked) {
      homeStrip.textContent = "Developer unlock active. Unlimited creations on this device.";
    } else if (copy.blocked) {
      homeStrip.textContent = "You've used your 10 free recipes. More coming soon.";
    } else if (state.successfulGenerationCount === 0) {
      homeStrip.textContent = `${FREE_GENERATION_LIMIT} free homemade creations included on this device.`;
    } else {
      homeStrip.textContent = `${copy.remaining} of ${FREE_GENERATION_LIMIT} free creations left on this device.`;
    }
  }
  return { state, copy };
}
