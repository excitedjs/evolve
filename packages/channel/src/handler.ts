import type { ServerResponse } from "node:http";
import { createGraph, loadRuntimeConfigFromEnv } from "@evolve/core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { OpenResponsesRequest, InputItem } from "./types";

const runtimeConfig = loadRuntimeConfigFromEnv();
const graph = createGraph(runtimeConfig);

function buildMessages(input: string | InputItem[], instructions?: string) {
  const messages: (HumanMessage | SystemMessage)[] = [];

  if (instructions) {
    messages.push(new SystemMessage(instructions));
  }

  if (typeof input === "string") {
    messages.push(new HumanMessage(input));
    return messages;
  }

  for (const item of input) {
    if (item.type === "message") {
      if (item.role === "user") {
        messages.push(new HumanMessage(item.content));
      } else if (item.role === "system" || item.role === "developer") {
        messages.push(new SystemMessage(item.content));
      }
    }
  }

  return messages;
}

function sseEvent(type: string, data: unknown): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function handleResponses(body: OpenResponsesRequest, res: ServerResponse) {
  const messages = buildMessages(body.input, body.instructions);

  if (!messages.length) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: { message: "No input messages", type: "invalid_request_error" } }));
    return;
  }

  if (body.stream) {
    await handleStream(messages, res);
  } else {
    await handleSync(messages, res);
  }
}

async function handleStream(messages: (HumanMessage | SystemMessage)[], res: ServerResponse) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const responseId = `resp_${Date.now()}`;

  res.write(sseEvent("response.created", { id: responseId, object: "response", status: "in_progress" }));
  res.write(sseEvent("response.in_progress", { id: responseId }));
  res.write(sseEvent("response.output_item.added", { output_index: 0, item: { type: "message", role: "assistant" } }));
  res.write(sseEvent("response.content_part.added", { output_index: 0, content_index: 0, part: { type: "output_text", text: "" } }));

  let fullText = "";

  const stream = await graph.stream({ messages }, { streamMode: "messages" });

  for await (const chunk of stream) {
    const [message, metadata] = chunk as unknown as [{ content: unknown }, { langgraph_node: string }];
    if (metadata.langgraph_node === "llm" && message.content) {
      const text = typeof message.content === "string" ? message.content : "";
      if (text) {
        fullText += text;
        res.write(sseEvent("response.output_text.delta", { output_index: 0, content_index: 0, delta: text }));
      }
    }
  }

  res.write(sseEvent("response.output_text.done", { output_index: 0, content_index: 0, text: fullText }));
  res.write(sseEvent("response.content_part.done", { output_index: 0, content_index: 0, part: { type: "output_text", text: fullText } }));
  res.write(sseEvent("response.output_item.done", { output_index: 0, item: { type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] } }));
  res.write(sseEvent("response.completed", {
    id: responseId,
    object: "response",
    status: "completed",
    output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: fullText }] }],
  }));
  res.write("data: [DONE]\n\n");
  res.end();
}

async function handleSync(messages: (HumanMessage | SystemMessage)[], res: ServerResponse) {
  const result = await graph.invoke({ messages });
  const lastMessage = result.messages[result.messages.length - 1];
  const text = typeof lastMessage.content === "string" ? lastMessage.content : "";

  const responseId = `resp_${Date.now()}`;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    id: responseId,
    object: "response",
    status: "completed",
    output: [{
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text }],
    }],
  }));
}
