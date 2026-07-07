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

// Dynamic import — used by eval/retriever-adapter.ts for real DB-backed evaluation.
declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: { datasources?: { db?: { url: string } } });
    $queryRawUnsafe<T = unknown>(query: string, ...params: unknown[]): Promise<T>;
    $disconnect(): Promise<void>;
  }
}
