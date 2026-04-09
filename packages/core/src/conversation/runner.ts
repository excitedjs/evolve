import { graph } from "../graph";
import type { ConversationMessage, ConversationStreamRunner } from "./types";

function toGraphMessages(messages: ConversationMessage[]) {
  return messages as Array<{ role: string; content: string }>;
}

export const defaultConversationRunner: ConversationStreamRunner = {
  async stream(input, options) {
    return graph.stream(
      {
        messages: toGraphMessages(input.messages),
      },
      options,
    );
  },
};
