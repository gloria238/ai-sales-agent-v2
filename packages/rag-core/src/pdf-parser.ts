/**
 * PDF parser — extracts raw text from PDF buffers.
 * Requires `pdf-parse` to be installed in the consuming app.
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import so consuming apps without pdf-parse still work
    const pdfParse = await import("pdf-parse").then((m) => m.default || m);
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Cannot find module") || msg.includes("pdf-parse")) {
      throw new Error(
        "pdf-parse is not installed. Install it in your app: pnpm add pdf-parse",
      );
    }
    throw err;
  }
}
