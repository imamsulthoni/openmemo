import { Hono } from "hono";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { OUTPUT_DIR } from "../../utils/pdf.js";
import { prisma } from "../../utils/prisma.js";

export const memosRouter = new Hono()
  .get("/", async (c) => {
    const sessionId = c.req.query("sessionId");
    if (!sessionId) {
      return c.json({ error: "sessionId query param is required" }, 400);
    }

    const memos = await prisma.memo.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    return c.json(memos);
  })
  .get("/:id/download", async (c) => {
    const id = c.req.param("id");

    const memo = await prisma.memo.findUnique({ where: { id } });
    if (!memo) {
      return c.json({ error: "Document not found" }, 404);
    }
    if (memo.status !== "completed" || !memo.filePath) {
      return c.json({ error: "Document is not ready yet" }, 409);
    }

    const filePath = path.join(OUTPUT_DIR, path.basename(memo.filePath));

    let size: number;
    try {
      ({ size } = await stat(filePath));
    } catch {
      return c.json({ error: "Document file is missing" }, 404);
    }

    const stream = Readable.toWeb(createReadStream(filePath));

    const disposition = c.req.query("download")
      ? `attachment; filename="${encodeURIComponent(memo.filename ?? "document.pdf")}"`
      : `inline; filename="${encodeURIComponent(memo.filename ?? "document.pdf")}"`;

    return new Response(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": String(size),
        "Cache-Control": "no-store",
      },
    });
  });
