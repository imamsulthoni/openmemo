import { Hono } from "hono";
import { prisma } from "../../utils/prisma.js";

const TITLE_MAX = 60;

interface StoredMessage {
  role: string;
  message: unknown;
}

function extractTitleFromFirstUserMessage(rows: StoredMessage[]): string {
  for (const row of rows) {
    if (row.role !== "user") continue;
    const content = row.message as { content?: Array<{ type?: string; text?: string }> };
    const text = (content.content ?? [])
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join(" ")
      .trim();
    if (text.length > 0) {
      return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX)}…` : text;
    }
  }
  return "New conversation";
}

export const sessionsRouter = new Hono()
  .get("/", async (c) => {
    const sessions = await prisma.agentMemorySession.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        sessionId: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          orderBy: { position: "asc" },
          take: 1,
          select: { role: true, message: true },
        },
      },
    });

    return c.json(
      sessions.map((session) => ({
        id: session.sessionId,
        title: extractTitleFromFirstUserMessage(
          session.messages as unknown as StoredMessage[],
        ),
        updatedAt: session.updatedAt,
        messageCount: session._count.messages,
      })),
    );
  })
  .get("/:sessionId/messages", async (c) => {
    const sessionId = c.req.param("sessionId");

    const messages = await prisma.agentMemoryMessage.findMany({
      where: { memorySession: { sessionId } },
      orderBy: { position: "asc" },
      select: { message: true },
    });

    return c.json({ messages: messages.map((row) => row.message) });
  });
