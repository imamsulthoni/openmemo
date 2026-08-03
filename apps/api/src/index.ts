import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { chatRouter } from "./modules/chat/router.js";
import { memosRouter } from "./modules/memos/router.js";
import { sessionsRouter } from "./modules/sessions/router.js";
import { cors } from "hono/cors";
import "./workers.js";

const app = new Hono()
  .use(cors())
  .route("/api/chat", chatRouter)
  .route("/api/sessions", sessionsRouter)
  .route("/api/memos", memosRouter);

app.get("/", (c) => c.json("openmemo-v1.0.0"));

serve({ fetch: app.fetch, port: 8000 }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
