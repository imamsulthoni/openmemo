import { Worker } from "bullmq";
import { connection, QUEUE_NAME } from "./config/queue-connection.js";
import { renderDocumentToPdf } from "./utils/pdf.js";
import { prisma } from "./utils/prisma.js";

export interface GenerateDocumentJob {
  documentId: string;
  content: string;
  filename: string;
  title: string;
  sessionId: string;
}

export const worker = new Worker<GenerateDocumentJob>(
  QUEUE_NAME,
  async (job) => {
    const { documentId, content, filename } = job.data;

    try {
      const filePath = await renderDocumentToPdf(content, filename);

      await prisma.memo.update({
        where: { id: documentId },
        data: { filePath, status: "completed" },
      });

      return { documentId, filePath, status: "done" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await prisma.memo.update({
        where: { id: documentId },
        data: { status: "failed", errorMessage: message },
      });

      throw error;
    }
  },
  { connection: connection },
);

worker.on("ready", () => {
  console.log(`[worker] listening on queue "${QUEUE_NAME}"`);
});
