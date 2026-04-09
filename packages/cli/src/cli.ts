import * as readline from "readline/promises";
import { stdin, stdout } from "process";
import { graph, logger } from "@evolve/core";
import { StreamHandler } from "./stream-handler";

export class CLI {
  private rl: readline.Interface;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.rl = readline.createInterface({
      input: stdin,
      output: stdout,
    });
  }

  async start(): Promise<void> {
    logger.info("CLI 对话已启动！输入 'exit' 或 'quit' 退出\n");

    while (true) {
      const userInput = await this.rl.question("你: ");
      logger.info(`用户输入: ${userInput}`);

      if (this.shouldExit(userInput)) {
        logger.info("用户请求退出");
        this.rl.close();
        break;
      }

      if (!userInput.trim()) {
        continue;
      }

      await this.processUserInput(userInput);
    }
  }

  private shouldExit(input: string): boolean {
    return input.toLowerCase() === "exit" || input.toLowerCase() === "quit";
  }

  private async processUserInput(userInput: string): Promise<void> {
    this.conversationHistory.push({ role: "user", content: userInput });

    process.stdout.write("AI: ");

    const readableStream = await graph.stream(
      {
        messages: this.conversationHistory,
      },
      {
        streamMode: "messages",
      },
    );

    const streamHandler = new StreamHandler();
    const assistantMessage = await streamHandler.process(readableStream);

    process.stdout.write("\n\n");

    if (assistantMessage) {
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });
    }
  }
}
