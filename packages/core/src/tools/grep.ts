import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { execSync } from "node:child_process";

export const grepTool = tool(
  async ({ pattern, path = "." }) => {
    try {
      const output = execSync(
        `grep -rn --include='*' "${pattern}" ${path}`,
        { encoding: "utf-8", timeout: 15_000, maxBuffer: 1024 * 1024 }
      );
      return output || "(no matches)";
    } catch (e: any) {
      if (e.status === 1) return "(no matches)";
      return `Error: ${e.message}`;
    }
  },
  {
    name: "grep",
    description:
      "Search for a pattern in files recursively. Returns matching lines with file paths and line numbers.",
    schema: z.object({
      pattern: z.string().describe("The text or regex pattern to search for"),
      path: z
        .string()
        .optional()
        .describe("Directory or file to search in (default: current dir)"),
    }),
  }
);
