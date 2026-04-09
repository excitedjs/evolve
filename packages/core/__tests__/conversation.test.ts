import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ConversationSession,
  type ConversationStreamRunner,
} from "../src/conversation";

function createRunner(chunks: unknown[]): ConversationStreamRunner {
  return {
    async stream() {
      return (async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      })();
    },
  };
}

describe("ConversationSession", () => {
  it("能把 reasoning 和 content 增量转成稳定事件并写回历史", async () => {
    const session = new ConversationSession({
      runner: createRunner([
        [
          {
            additional_kwargs: {
              reasoning: {
                summary: [{ type: "summary_text", text: "先确认上下文。" }],
              },
            },
          },
        ],
        [{ content: [{ type: "text", text: "你好" }] }],
        [{ content: "，世界" }],
      ]),
    });

    const events = [];
    for await (const event of session.submit("你好")) {
      events.push(event);
    }

    assert.deepEqual(events, [
      { type: "reasoning", text: "先确认上下文。" },
      { type: "content", text: "你好" },
      { type: "content", text: "，世界" },
      {
        type: "done",
        message: { role: "assistant", content: "你好，世界" },
      },
    ]);

    assert.deepEqual(session.getMessages(), [
      { role: "user", content: "你好" },
      { role: "assistant", content: "你好，世界" },
    ]);
  });

  it("空输入会直接拒绝，避免产生脏会话", async () => {
    const session = new ConversationSession({
      runner: createRunner([]),
    });

    await assert.rejects(async () => {
      const stream = session.submit("   ");
      await stream.next();
    }, /User input cannot be empty/);

    assert.deepEqual(session.getMessages(), []);
  });

  it("runner 抛错时保留用户输入，但不伪造 assistant 消息", async () => {
    const session = new ConversationSession({
      runner: {
        async stream() {
          throw new Error("network down");
        },
      },
    });

    await assert.rejects(async () => {
      const stream = session.submit("继续");
      await stream.next();
    }, /network down/);

    assert.deepEqual(session.getMessages(), [{ role: "user", content: "继续" }]);
  });
});
