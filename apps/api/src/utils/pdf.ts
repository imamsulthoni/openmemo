import { markdownToPdf, evict } from "@mdpdf/mdpdf";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const OUTPUT_DIR = path.resolve(process.cwd(), "doc-output");

/**
 * Render markdown content into a PDF file using @mdpdf/mdpdf (Typst-based).
 */
export async function renderDocumentToPdf(
  content: string,
  fileName: string,
): Promise<string> {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const filePath = path.join(OUTPUT_DIR, fileName);

  const pdfBuffer = await markdownToPdf(content, {
    pageSize: "a4",
    margin: "20mm",
    fontSize: 11,
    toc: true,
  });

  await writeFile(filePath, pdfBuffer);

  // Evict Typst memoization cache to prevent memory leak in long-running process
  evict(0);

  return filePath;
}
