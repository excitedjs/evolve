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
    } catch (e: unknown) {
      if (e instanceof Error && "status" in e) {
        const status = (e as unknown as Record<string, unknown>).status as number;
        const stderr = (e as unknown as Record<string, unknown>).stderr as string;
        return `Exit code ${status ?? 1}\n${stderr || e.message}`;
      }
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
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
