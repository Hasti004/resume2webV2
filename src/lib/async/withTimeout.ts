export class TimeoutError extends Error {
  override name = "TimeoutError";
}

/**
 * Race a promise against a timeout. Rejects with TimeoutError if ms elapses first.
 */
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new TimeoutError(`${label} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}
