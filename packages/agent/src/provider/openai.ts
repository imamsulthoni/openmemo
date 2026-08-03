import { OpenAIClient } from "@anvia/openai"

const client = new OpenAIClient({
  baseUrl: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export const defaultModel = client.completionModel("deepseek-v4-flash");
