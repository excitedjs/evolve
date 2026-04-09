import type { ConversationStreamEvent } from "@evolve/core";
import type { TranscriptMessage } from "./types";
import { formatError } from "./utils";

export function createUserMessage(userInput: string): TranscriptMessage {
  return {
    id: createMessageId("user"),
    role: "user",
    content: userInput,
    reasoning: "",
    pending: false,
  };
}

export function createPendingAssistantMessage(): TranscriptMessage {
  return {
    id: createMessageId("assistant"),
    role: "assistant",
    content: "",
    reasoning: "",
    pending: true,
  };
}

export function applyStreamEvent(
  message: TranscriptMessage,
  event: ConversationStreamEvent,
): TranscriptMessage {
  if (event.type === "reasoning") {
    return {
      ...message,
      reasoning: `${message.reasoning}${event.text}`,
    };
  }

  if (event.type === "content") {
    return {
      ...message,
      content: `${message.content}${event.text}`,
    };
  }

  return {
    ...message,
    content: event.message.content,
    pending: false,
  };
}

export function finalizeAssistantMessage(
  message: TranscriptMessage,
): TranscriptMessage {
  return {
    ...message,
    pending: false,
  };
}

export function failAssistantMessage(
  message: TranscriptMessage,
  error: unknown,
): TranscriptMessage {
  return {
    ...message,
    pending: false,
    error: formatError(error),
    content: message.content || "这次请求没有成功返回内容。",
  };
}

function createMessageId(prefix: "user" | "assistant"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
