import type { ConversationRuntimeConfig } from "../config";
import { loadRuntimeConfigFromEnv } from "../config";
import { createGraph } from "../graph";
import type { ConversationMessage, ConversationStreamRunner } from "./types";

function toGraphMessages(messages: ConversationMessage[]) {
  return messages as Array<{ role: string; content: string }>;
}

export function createConversationRunner(
  runtimeConfig:
    | ConversationRuntimeConfig
    | (() => ConversationRuntimeConfig),
): ConversationStreamRunner {
  return {
    async stream(input, options) {
      const currentRuntimeConfig =
        typeof runtimeConfig === "function" ? runtimeConfig() : runtimeConfig;
      const graph = createGraph(currentRuntimeConfig);

      return graph.stream(
        {
          messages: toGraphMessages(input.messages),
        },
        options,
      );
    },
  };
}

export const defaultConversationRunner: ConversationStreamRunner = {
  async stream(input, options) {
    return createConversationRunner(loadRuntimeConfigFromEnv()).stream(
      input,
      options,
    );
  },
};
