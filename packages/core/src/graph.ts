import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import type { ConversationRuntimeConfig } from "./config";
import { createChatModel } from "./config";

function createInvocationOptions(runtimeConfig: ConversationRuntimeConfig) {
  if (runtimeConfig.model.provider !== "openai") {
    return undefined;
  }

  return {
    stream_options: { include_usage: true },
    ...(runtimeConfig.model.api === "responses" &&
    runtimeConfig.model.webSearch !== false
      ? {
          tools: [
            {
              type: "web_search",
            },
          ],
        }
      : {}),
  };
}

export function createGraph(runtimeConfig: ConversationRuntimeConfig) {
  const chatModel = createChatModel(runtimeConfig);

  const llm = async (state: typeof MessagesAnnotation.State) => {
    const message = await chatModel.invoke(
      state.messages,
      createInvocationOptions(runtimeConfig),
    );
    return { messages: [message] };
  };

  return new StateGraph(MessagesAnnotation)
    .addNode("llm", llm)
    .addEdge(START, "llm")
    .addEdge("llm", END)
    .compile();
}
