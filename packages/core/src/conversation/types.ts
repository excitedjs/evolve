export type ConversationRole = "user" | "assistant";

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
}

export type ConversationStreamEvent =
  | { type: "reasoning"; text: string }
  | { type: "content"; text: string }
  | { type: "done"; message: ConversationMessage };

export interface ConversationStreamRunner {
  stream(
    input: { messages: ConversationMessage[] },
    options: { streamMode: "messages" },
  ): Promise<AsyncIterable<unknown>>;
}

export interface ConversationSessionOptions {
  initialMessages?: ConversationMessage[];
  runner?: ConversationStreamRunner;
}

export interface MessageChunk {
  content?: unknown;
  additional_kwargs?: {
    reasoning?: {
      summary?: Array<{ type?: string; text?: string }>;
    };
  };
}
