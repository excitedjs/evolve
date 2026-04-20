import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { execSync } from "node:child_process";

export const bashTool = tool(
  async ({ command }) => {
    try {
      const output = execSync(command, {
        encoding: "utf-8",
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
      });
      return output || "(no output)";
    } catch (e: any) {
      return `Exit code ${e.status ?? 1}\n${e.stderr || e.message}`;
    }
  },
  {
    name: "bash",
    description:
      "Execute a shell command and return its stdout. Timeout: 30s.",
    schema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
  }
);
