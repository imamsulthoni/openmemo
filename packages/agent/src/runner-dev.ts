import { createAgent } from "./agent.js";

const propmts = [
  `What model are you?`,
  `Analyze gold prices in the last 7 days`,
  `find format of memo and official letter`,
];

try {
  const agent = createAgent({
    agentId: "tegami-agent",
  });

  const res = await agent.prompt(propmts[0]!).send();
  console.log("Output: ", res.output);
  console.log("Usage: ", res.usage);
} catch (error) {
  console.error("Error: ", error);
} finally {
}
