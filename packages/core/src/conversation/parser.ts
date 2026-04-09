import type { MessageChunk } from "./types";

export function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        Boolean(
          part &&
            typeof part === "object" &&
            "type" in part &&
            "text" in part &&
            (part as { type?: string }).type === "text" &&
            typeof (part as { text?: unknown }).text === "string",
        ),
    )
    .map((part) => part.text)
    .join("");
}

export function normalizeChunk(rawChunk: unknown): MessageChunk | null {
  if (Array.isArray(rawChunk) && rawChunk[0]) {
    return rawChunk[0] as MessageChunk;
  }

  if (rawChunk && typeof rawChunk === "object") {
    return rawChunk as MessageChunk;
  }

  return null;
}

export function extractReasoningText(chunk: MessageChunk): string {
  const summary = chunk.additional_kwargs?.reasoning?.summary;
  if (Array.isArray(summary)) {
    return summary
      .filter(
        (item): item is { type: "summary_text"; text: string } =>
          item?.type === "summary_text" && typeof item.text === "string",
      )
      .map((item) => item.text)
      .join("");
  }

  if (!Array.isArray(chunk.content)) {
    return "";
  }

  return chunk.content
    .filter(
      (
        item,
      ): item is { type: "thinking"; thinking: string } =>
        Boolean(
          item &&
            typeof item === "object" &&
            "type" in item &&
            "thinking" in item &&
            (item as { type?: string }).type === "thinking" &&
            typeof (item as { thinking?: unknown }).thinking === "string",
        ),
    )
    .map((item) => item.thinking)
    .join("");
}
