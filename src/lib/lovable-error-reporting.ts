export function reportLovableError(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    const win = window as unknown as { __lovableErrors?: unknown[] };
    win.__lovableErrors = win.__lovableErrors || [];
    win.__lovableErrors.push({ error, context, timestamp: Date.now() });
  }
  console.error("[Lovable Error]", error, context);
}
