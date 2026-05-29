// Local-only image capture for ScratchnScan package draft.
// We compress to a small JPEG data URL so IndexedDB stays small.
// TODO: when real OCR/AI is wired in, store originals via a content store
// (e.g. IndexedDB blob keyed by uuid) instead of inline data URLs.

const MAX_EDGE = 720;
const JPEG_QUALITY = 0.78;

// Explicit allowlist of safe raster formats. SVG is intentionally excluded —
// it can embed scripts and is an XSS vector when set as an img src or drawn
// onto a canvas that is later read back.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/gif",
]);

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = dataUrl;
  });
}

export async function compressImageFile(file) {
  if (!file || !file.type || !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error("Unsupported file type. Please use a JPG, PNG, WebP, or HEIC photo.");
  }
  const rawDataUrl = await readFileAsDataUrl(file);
  let img;
  try {
    img = await loadImage(rawDataUrl);
  } catch {
    // Fallback: return the raw data URL if decoding fails (e.g. HEIC on some
    // browsers). We accept this for the MVP; large files are gated below.
    if (file.size <= 1_500_000) return rawDataUrl;
    throw new Error("Could not process that image. Try a JPG or PNG.");
  }

  const { width, height } = img;
  const longest = Math.max(width, height);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  try {
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    return rawDataUrl;
  }
}
