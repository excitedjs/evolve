import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFile } from "node:fs/promises";

export const readTool = tool(
  async ({ file_path }) => {
    const content = await readFile(file_path, "utf-8");
    return content;
  },
  {
    name: "read",
    description:
      "Read the contents of a file at the given path. Returns the full text content.",
    schema: z.object({
      file_path: z.string().describe("Absolute or relative path to the file"),
    }),
  }
);
