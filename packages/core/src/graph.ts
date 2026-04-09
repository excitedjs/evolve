import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { chatModel } from "./config";

const llm = async (state: typeof MessagesAnnotation.State) => {
  const message = await chatModel.invoke(state.messages, {
    stream_options: { include_usage: true },
    tools: [
      {
        type: "web_search",
      },
    ],
  });
  return { messages: [message] };
};

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("llm", llm)
  .addEdge(START, "llm")
  .addEdge("llm", END)
  .compile();
