import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";
import type { ConversationRuntimeConfig } from "./config";
import { createChatModel } from "./config";
import { tools } from "./tools";

export function createGraph(runtimeConfig: ConversationRuntimeConfig) {
  const chatModel = createChatModel(runtimeConfig);
  const modelWithTools = chatModel.bindTools(tools);
  const toolNode = new ToolNode(tools);

  const llm = async (state: typeof MessagesAnnotation.State) => {
    const message = await modelWithTools.invoke(state.messages);
    return { messages: [message] };
  };

  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    if (lastMessage.tool_calls?.length) return "tools";
    return END;
  }

  return new StateGraph(MessagesAnnotation)
    .addNode("llm", llm)
    .addNode("tools", toolNode)
    .addEdge(START, "llm")
    .addConditionalEdges("llm", shouldContinue, ["tools", END])
    .addEdge("tools", "llm")
    .compile();
}
