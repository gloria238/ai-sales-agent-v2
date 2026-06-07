// Optional peer dependency declarations.
// pdf-parse and mammoth are only needed if the consuming app uses
// PDF/DOCX parsing. The parsers handle missing modules gracefully.
declare module "pdf-parse" {
  export class PDFParse {
    constructor(options: { data: Buffer | Uint8Array });
    getText(params?: Record<string, unknown>): Promise<{ text: string; pages: Array<{ num: number; text: string }>; total: number }>;
    destroy(): Promise<void>;
  }
}

declare module "mammoth" {
  function extractRawText(options: { buffer: Buffer }): Promise<{ value: string }>;
  export { extractRawText };
}
