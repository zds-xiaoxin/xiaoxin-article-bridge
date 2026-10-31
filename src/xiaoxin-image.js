/* Local image compression. Runs entirely in the side panel with OffscreenCanvas; nothing is uploaded. */
((root) => {
  const MiB = 1024 * 1024;
  const LIMITS = Object.freeze({
    totalBytes: 24 * MiB, // package limit, same as xiaoxin-bundle MAX_BYTES
    singleTarget: 5 * MiB, // images above this are re-encoded; common X photo limit, may change
    headroom: 0.95, // aim slightly under the package limit
    maxEdge: 4096, // local quality/memory policy, not a claim about X's current limits
    minEdge: 640, // never shrink the long edge below this while searching
    minTarget: 64 * 1024
  });
  const QUALITY_STEPS = Object.freeze([0.9, 0.82, 0.74, 0.66, 0.58, 0.5]);
  const SCALE_STEP = 0.8;

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value >= MiB) return `${(value / MiB).toFixed(1)} MiB`;
    if (value >= 1024) return `${Math.round(value / 1024)} KiB`;
    return `${value} B`;
  }

  function fitWithin(width, height, maxEdge = LIMITS.maxEdge) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const edge = Math.max(w, h);
    if (edge <= maxEdge) return { width: w, height: h };
    const scale = maxEdge / edge;
    return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
  }

  // Ordered encode attempts: every quality step at each size, shrinking by SCALE_STEP until minEdge.
  function encodeAttempts(width, height, limits = LIMITS) {
    const attempts = [];
    let size = fitWithin(width, height, limits.maxEdge);
    for (;;) {
      for (const quality of QUALITY_STEPS) attempts.push({ ...size, quality });
      const edge = Math.max(size.width, size.height);
      if (edge <= limits.minEdge) break;
      size = fitWithin(size.width, size.height, Math.max(limits.minEdge, Math.floor(edge * SCALE_STEP)));
    }
    return attempts;
  }

  function outputTypeFor(sourceType, hasAlpha) {
    return hasAlpha && sourceType !== 'image/jpeg' ? 'image/webp' : 'image/jpeg';
  }

  // items: [{ id, bytes, type }]. GIFs are never re-encoded (would lose animation).
  // Returns per-item byte targets so that each image fits singleTarget and the package fits totalBytes.
  function planCompression(items, limits = LIMITS) {
    const fixed = items.filter((item) => item.type === 'image/gif');
    const flexible = items.filter((item) => item.type !== 'image/gif');
    const fixedBytes = fixed.reduce((sum, item) => sum + item.bytes, 0);
    const caps = new Map(flexible.map((item) => [item.id, Math.min(item.bytes, limits.singleTarget)]));
    let capTotal = 0;
    for (const value of caps.values()) capTotal += value;
    let level = Infinity;
    let impossible = false;
    if (fixedBytes + capTotal > limits.totalBytes) {
      let remaining = Math.floor(limits.totalBytes * limits.headroom) - fixedBytes;
      const sorted = [...caps.values()].sort((a, b) => a - b);
      level = remaining / Math.max(1, sorted.length);
      for (let index = 0; index < sorted.length; index += 1) {
        const share = remaining / (sorted.length - index);
        if (sorted[index] <= share) { remaining -= sorted[index]; continue; }
        level = share;
        break;
      }
      if (!flexible.length || level < limits.minTarget) impossible = true;
    }
    const targets = new Map();
    for (const item of flexible) {
      const target = Math.floor(Math.min(caps.get(item.id), level));
      if (target < item.bytes) targets.set(item.id, target);
    }
    const largeGifs = fixed.filter((item) => item.bytes > limits.singleTarget).map((item) => item.id);
    return { targets, impossible, largeGifs, fixedBytes };
  }

  function detectAlpha(bitmap, env) {
    const probe = fitWithin(bitmap.width, bitmap.height, 512);
    const canvas = new env.OffscreenCanvas(probe.width, probe.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, probe.width, probe.height);
    const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
    for (let index = 3; index < data.length; index += 4) if (data[index] < 255) return true;
    return false;
  }

  // Returns the first encode under targetBytes, else the smallest one; null if nothing beat the original.
  async function compressImage(blob, targetBytes, { env = root, limits = LIMITS } = {}) {
    const bitmap = await env.createImageBitmap(blob);
    try {
      const hasAlpha = blob.type !== 'image/jpeg' && detectAlpha(bitmap, env);
      const type = outputTypeFor(blob.type, hasAlpha);
      let best = null;
      let canvas = null;
      for (const attempt of encodeAttempts(bitmap.width, bitmap.height, limits)) {
        if (!canvas || canvas.width !== attempt.width || canvas.height !== attempt.height) {
          canvas = new env.OffscreenCanvas(attempt.width, attempt.height);
          const ctx = canvas.getContext('2d');
          if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, attempt.width, attempt.height); }
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, attempt.width, attempt.height);
        }
        const output = await canvas.convertToBlob({ type, quality: attempt.quality });
        if (output.type !== type) throw new Error(`This browser cannot encode ${type}.`);
        if (!best || output.size < best.blob.size) best = { blob: output, ...attempt };
        if (output.size <= targetBytes) break;
      }
      if (!best || best.blob.size >= blob.size) return null;
      return {
        blob: best.blob, bytes: best.blob.size, type, width: best.width, height: best.height,
        quality: best.quality, sourceWidth: bitmap.width, sourceHeight: bitmap.height,
        reachedTarget: best.blob.size <= targetBytes
      };
    } finally {
      bitmap.close?.();
    }
  }

  const api = { LIMITS, QUALITY_STEPS, formatBytes, fitWithin, encodeAttempts, outputTypeFor, planCompression, compressImage };
  if (typeof module !== 'undefined') module.exports = api;
  root.xiaoxinImage = api;
})(typeof window !== 'undefined' ? window : globalThis);
