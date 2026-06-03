// Optional peer dependency declarations.
// pdf-parse and mammoth are only needed if the consuming app uses
// PDF/DOCX parsing. The parsers handle missing modules gracefully.
declare module "pdf-parse" {
  function pdfParse(buffer: Buffer): Promise<{ text: string; numpages: number }>;
  export default pdfParse;
}

declare module "mammoth" {
  function extractRawText(options: { buffer: Buffer }): Promise<{ value: string }>;
  export { extractRawText };
}
