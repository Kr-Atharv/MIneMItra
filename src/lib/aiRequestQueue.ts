// MineMitra — shared client-side request queue (Step 3).
//
// Root cause this fixes: AskGovernanceAI, AIRiskCard/AIAnalysisModal, and
// GovernanceOverview's useEffect each independently called AI endpoints
// with no shared throttle. Asking a few questions quickly, or opening
// several risk cards, burst past free-tier rate limits (Groq/Gemini, and
// now the Step 5 weather/AQI/rulebook APIs), returning 429s.
//
// This is a single, app-wide FIFO queue: every outgoing external call
// (LLM + weather/AQI/rulebook) is serialized through here, with a minimum
// gap between dispatches, so only one request is ever in flight at a time
// no matter how many components ask for one concurrently.

import { useEffect, useState } from 'react';

// Minimum spacing between dispatched requests, app-wide.
const MIN_GAP_MS = 1200;

interface QueueTask<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const queue: QueueTask<unknown>[] = [];
const listeners = new Set<(length: number) => void>();

let processing = false;
let lastDispatchAt = 0;

function notify() {
  listeners.forEach((listener) => listener(queue.length));
}

async function pump() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const task = queue.shift();
    if (!task) continue;
    notify();

    const elapsed = Date.now() - lastDispatchAt;
    const wait = Math.max(0, MIN_GAP_MS - elapsed);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    lastDispatchAt = Date.now();
    try {
      const result = await task.run();
      task.resolve(result);
    } catch (err) {
      task.reject(err);
    }
  }
  processing = false;
  notify();
}

/**
 * Enqueue any external call (AI or otherwise) so it's serialized against
 * every other queued call app-wide. The returned promise resolves/rejects
 * exactly like calling `run()` directly would have — this only changes
 * *when* `run()` fires, never its result.
 */
export function enqueueRequest<T>(run: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ run, resolve, reject } as QueueTask<unknown>);
    notify();
    void pump();
  });
}

/** Current number of calls still waiting to be dispatched (0 = none). */
export function getQueueLength(): number {
  return queue.length;
}

export function onQueueLengthChange(listener: (length: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook: current queue length, live-updated. Use to show a "waiting" state. */
export function useAiQueueLength(): number {
  const [length, setLength] = useState(getQueueLength());
  useEffect(() => onQueueLengthChange(setLength), []);
  return length;
}
