import { Hono } from "hono";
import { createAgent, tracing } from "@openmemo/agent";
import { createEventStream } from "@anvia/server";
import { createPrismaMemoryStore } from "@anvia/memory-prisma";
import { prisma } from "../../utils/prisma.js";
import { createMemoTool } from "../../tools/generate-memo.js";

export const chatRouter = new Hono().post("/", async (c) => {
  const body = await c.req.json();
  const messages = body.messages;
  const lastMessage = messages.at(-1);

  const SESSION_ID = c.req.query("sessionId") || "default";

  const prismaMemory = createPrismaMemoryStore(prisma);

  const agent = createAgent({
    agentId: "openmemo-chat-agent",
    tracing: tracing,
    memory: prismaMemory,
    additionalTools: [createMemoTool({ sessionId: SESSION_ID })],
    additionalInstructions: [
      `If the user asks about anything unrelated to document creation, politely redirect.`,
    ],
  });

  const res = agent
    .session(SESSION_ID)
    .prompt(lastMessage)
    .withTrace({ sessionId: SESSION_ID })
    .stream();

  return createEventStream(res, { format: "jsonl" });
});
