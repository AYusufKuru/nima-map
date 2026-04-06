/** `pdf_url` (public storage) içinden `reports` bucket nesne yolu — silme için. */
export function extractReportsStoragePath(pdfUrl: string | null | undefined): string | null {
  if (!pdfUrl?.trim()) return null;
  try {
    const u = new URL(pdfUrl);
    const pub = '/object/public/reports/';
    const i = u.pathname.indexOf(pub);
    if (i !== -1) {
      return decodeURIComponent(u.pathname.slice(i + pub.length));
    }
  } catch {
    /* ignore */
  }
  return null;
}
