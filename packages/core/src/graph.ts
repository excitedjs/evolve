import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage } from "@langchain/core/messages";
import { chatModel } from "./config";
import { tools } from "./tools";

const modelWithTools = chatModel.bindTools(tools);

const llm = async (state: typeof MessagesAnnotation.State) => {
  const message = await modelWithTools.invoke(state.messages);
  return { messages: [message] };
};

const toolNode = new ToolNode(tools);

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) return "tools";
  return END;
}

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("llm", llm)
  .addNode("tools", toolNode)
  .addEdge(START, "llm")
  .addConditionalEdges("llm", shouldContinue, ["tools", END])
  .addEdge("tools", "llm")
  .compile();
