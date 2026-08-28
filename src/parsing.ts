import * as pdfParse from "pdf-parse";

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer as any);
  return data.text.replace(/\s+\n/g, "\n").trim();
}

export function normalizeText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
}
