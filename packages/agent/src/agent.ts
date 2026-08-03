import {
  AgentBuilder,
  type AnyTool,
  type CompletionModel,
  type MemoryStore,
} from "@anvia/core";
import type { LangfuseTracing } from "@anvia/langfuse";
import { defaultModel } from "./provider/openai.js";
import { createWebTool } from "./tools/web-search.js";
import { BASE_INSTRUCTION } from "./prompts/base-instruction.js";

interface CreateAgentOptions {
  agentId: string;
  model?: CompletionModel;
  additionalTools?: AnyTool[];
  additionalInstructions?: string[];
  tracing?: LangfuseTracing;
  memory?: MemoryStore;
}

export function createAgent(opts: CreateAgentOptions) {
  const agent = new AgentBuilder(opts.agentId, opts.model || defaultModel)
    .instructions(BASE_INSTRUCTION)
    .tools([...createWebTool()]);

  if (opts.tracing) {
    agent.observe(opts.tracing);
  }

  if (opts.additionalTools) {
    for (const tool of opts.additionalTools) {
      agent.tools([tool]);
    }
  }

  if (opts.additionalInstructions) {
    for (const instruction of opts.additionalInstructions) {
      agent.instructions(instruction);
    }
  }

  if (opts.memory) {
    agent.memory(opts.memory);
  }

  return agent.build();
}
