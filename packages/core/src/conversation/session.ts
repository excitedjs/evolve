import {
  extractReasoningText,
  extractTextContent,
  normalizeChunk,
} from "./parser";
import { defaultConversationRunner } from "./runner";
import type {
  ConversationMessage,
  ConversationSessionOptions,
  ConversationStreamEvent,
  ConversationStreamRunner,
} from "./types";

export class ConversationSession {
  private readonly history: ConversationMessage[];
  private readonly runner: ConversationStreamRunner;

  constructor(options: ConversationSessionOptions = {}) {
    this.history = [...(options.initialMessages ?? [])];
    this.runner = options.runner ?? defaultConversationRunner;
  }

  getMessages(): ConversationMessage[] {
    return [...this.history];
  }

  async *submit(
    userInput: string,
  ): AsyncGenerator<ConversationStreamEvent, ConversationMessage> {
    const content = userInput.trim();
    if (!content) {
      throw new Error("User input cannot be empty");
    }

    this.history.push({ role: "user", content });

    const stream = await this.runner.stream(
      { messages: this.getMessages() },
      { streamMode: "messages" },
    );

    let assistantContent = "";

    for await (const rawChunk of stream) {
      const chunk = normalizeChunk(rawChunk);
      if (!chunk) {
        continue;
      }

      const reasoningText = extractReasoningText(chunk);
      if (reasoningText) {
        yield { type: "reasoning", text: reasoningText };
      }

      const contentText = extractTextContent(chunk.content);
      if (contentText) {
        assistantContent += contentText;
        yield { type: "content", text: contentText };
      }
    }

    const assistantMessage = {
      role: "assistant" as const,
      content: assistantContent,
    };
    this.history.push(assistantMessage);

    yield { type: "done", message: assistantMessage };

    return assistantMessage;
  }
}
