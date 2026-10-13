export class RequestBodyError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function readBoundedBody(request, limit = 24000, timeoutMs = 5000) {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null && Number(declaredLength) > limit) {
    throw new RequestBodyError('Keep teaching examples under 24,000 bytes.', 413);
  }
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let bytes = 0, timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError('The request body took too long to arrive.', 408)), timeoutMs);
  });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) throw new RequestBodyError('Keep teaching examples under 24,000 bytes.', 413);
      chunks.push(value);
    }
    return Buffer.concat(chunks, bytes).toString('utf8');
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally { clearTimeout(timer); }
}

// One process-wide budget, without collecting visitor IPs or storing HDL.
export function createSynthesisBudget(maxStarts = 0, windowMs = 60000, now = Date.now) {
  let starts = [];
  return () => {
    if (maxStarts <= 0) return 0;
    const time = now();
    starts = starts.filter(start => time - start < windowMs);
    if (starts.length >= maxStarts) return Math.max(1, Math.ceil((windowMs - (time - starts[0])) / 1000));
    starts.push(time);
    return 0;
  };
}
