import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { graph } from "../src/graph";

/** 从 LangChain message 的 content 中提取纯文本 */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  }
  return String(content);
}

describe("graph", () => {
  it("invoke 能正常调用模型并返回 AI 响应", { timeout: 30_000 }, async () => {
    const result = await graph.invoke({
      messages: [{ role: "user", content: "只回复ok两个字母，不要说其他任何内容" }],
    });

    assert.ok(Array.isArray(result.messages), "返回结果应包含 messages 数组");
    assert.ok(result.messages.length >= 2, "应至少包含用户消息和 AI 响应");

    const aiMessage = result.messages[result.messages.length - 1];
    const text = extractText(aiMessage.content);
    assert.ok(text.length > 0, "AI 响应内容不应为空");
    assert.ok(
      text.toLowerCase().includes("ok"),
      `AI 应回复包含 'ok'，实际: ${text}`,
    );
  });

  it("invoke 能处理多轮对话历史", { timeout: 30_000 }, async () => {
    const result = await graph.invoke({
      messages: [
        { role: "user", content: "你好" },
        { role: "assistant", content: "你好！有什么可以帮你的？" },
        { role: "user", content: "只回复收到两个字" },
      ],
    });

    // 验证返回的 messages 数量大于输入（新增了 AI 响应）
    assert.ok(
      result.messages.length > 3,
      `应返回至少4条消息（3条输入 + AI响应），实际: ${result.messages.length}`,
    );

    const aiMessage = result.messages[result.messages.length - 1];
    const text = extractText(aiMessage.content);
    assert.ok(text.length > 0, "最终 AI 响应不应为空");
  });

  it(
    "Responses API 返回无 annotations 的文本时不应崩溃",
    { timeout: 30_000 },
    async () => {
      // 简单算术题不会触发 web_search，返回的 text part 通常没有 annotations
      const result = await graph.invoke({
        messages: [{ role: "user", content: "1+1等于几？只回复数字" }],
      });

      const aiMessage = result.messages[result.messages.length - 1];
      const text = extractText(aiMessage.content);
      assert.ok(text.length > 0, "AI 响应不应为空");
      assert.ok(text.includes("2"), `应包含 '2'，实际: ${text}`);
    },
  );

  it("stream 模式能逐步返回响应内容", { timeout: 30_000 }, async () => {
    const stream = await graph.stream(
      {
        messages: [
          { role: "user", content: "从1数到5，每个数字之间用逗号分隔" },
        ],
      },
      { streamMode: "messages" },
    );

    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    assert.ok(chunks.length > 1, `流式响应应有多个 chunk，实际: ${chunks.length}`);

    let fullContent = "";
    for (const chunk of chunks) {
      const msg = Array.isArray(chunk) ? chunk[0] : chunk;
      fullContent += extractText(msg?.content);
    }

    assert.ok(fullContent.length > 0, "流式响应拼接后内容不应为空");
  });
});
