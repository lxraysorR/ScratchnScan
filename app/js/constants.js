// Shared frontend constants.
// Import from here rather than duplicating magic numbers across modules.

// Milliseconds to wait for an AI generation response before aborting.
// Must stay in sync with the Worker-side Gemini timeout (30 s) — the
// frontend fires slightly earlier so the user sees a clear message.
export const AI_TIMEOUT_MS = 25_000;
