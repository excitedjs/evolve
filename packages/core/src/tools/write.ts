import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export const writeTool = tool(
  async ({ file_path, content }) => {
    await mkdir(dirname(file_path), { recursive: true });
    await writeFile(file_path, content, "utf-8");
    return `Written to ${file_path}`;
  },
  {
    name: "write",
    description:
      "Write content to a file. Creates parent directories if needed. Overwrites existing content.",
    schema: z.object({
      file_path: z.string().describe("Path to the file to write"),
      content: z.string().describe("Content to write to the file"),
    }),
  }
);
