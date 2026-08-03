import { createTool } from "@anvia/core";
import z from "zod";
import path from "node:path";
import { prisma } from "../utils/prisma.js";
import { documentQueue } from "../config/queue.js";
import type { GenerateDocumentJob } from "../workers.js";

interface CreateDocumentContext {
  sessionId: string;
}

function safeFilename(filename: string): string {
  const base = path.basename(filename).replace(/\s+/g, "-");
  return base.endsWith(".pdf") ? base : `${base}.pdf`;
}

export function createMemoTool(ctx: CreateDocumentContext) {
  return createTool({
    name: "create-document",
    description:
      "Save a generated document (memo, official letter, report, announcement) for PDF export. " +
      "Call this after composing the full document content.",
    input: z.object({
      title: z
        .string()
        .describe("Document title, e.g. Surat Resmi Undangan Rapat"),
      filename: z
        .string()
        .describe("File name including .pdf extension, e.g. surat-resmi.pdf"),
      content: z.string().describe("Full document content in markdown format"),
    }),
    execute: async ({ title, filename, content }) => {
      const safeName = safeFilename(filename);

      const document = await prisma.memo.create({
        data: {
          sessionId: ctx.sessionId,
          title,
          content,
          filename: safeName,
          status: "pending",
        },
      });

      await documentQueue.add("generate-memo", {
        documentId: document.id,
        content,
        filename: safeName,
        title,
        sessionId: ctx.sessionId,
      } satisfies GenerateDocumentJob);

      return {
        documentId: document.id,
        title: document.title,
        filename: document.filename,
        status: "queued",
        message:
          "Document saved and queued for PDF generation. It will be ready shortly.",
      };
    },
  });
}
