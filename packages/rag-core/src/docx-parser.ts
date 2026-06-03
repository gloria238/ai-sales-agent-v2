/**
 * DOCX parser — extracts raw text from .docx files.
 * Requires `mammoth` to be installed in the consuming app.
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth").then((m) => m.default || m);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Cannot find module") || msg.includes("mammoth")) {
      throw new Error(
        "mammoth is not installed. Install it in your app: pnpm add mammoth",
      );
    }
    throw err;
  }
}
