import type { ConnectionOptions } from "bullmq";

export const QUEUE_NAME = "documents";

export const connection: ConnectionOptions = {
  host: "localhost",
  port: 16379,
};
