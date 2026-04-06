/**
 * Edge Function 4xx/5xx döndüğünde Supabase istemcisi bazen `data` yerine
 * gövdeyi `error.context` (Response) üzerinde bırakır; `{ error: string }`
 * mesajını buradan okur.
 */
export async function getFunctionInvokeErrorMessage(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === 'object' && data !== null && 'error' in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === 'string' && e.trim()) return e;
  }
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const j = (await ctx.clone().json()) as { error?: string };
        if (typeof j?.error === 'string' && j.error.trim()) return j.error;
      } catch {
        /* ignore */
      }
    }
  }
  if (error instanceof Error) return error.message;
  return String(error ?? 'Bilinmeyen hata');
}
