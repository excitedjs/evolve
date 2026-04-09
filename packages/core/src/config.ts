import { ChatOpenAI } from "@langchain/openai";

const {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  REASONING_EFFORT = "high",
  REASONING_SUMMARY = "auto",
} = process.env;

if (!OPENAI_API_KEY) throw new Error("Missing env: OPENAI_API_KEY");
if (!OPENAI_BASE_URL) throw new Error("Missing env: OPENAI_BASE_URL");
if (!OPENAI_MODEL) throw new Error("Missing env: OPENAI_MODEL");

export const chatModel = new ChatOpenAI({
  model: OPENAI_MODEL,
  configuration: {
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL,
  },
  reasoning: {
    effort: REASONING_EFFORT as "high" | "medium" | "low",
    summary: REASONING_SUMMARY as "auto" | "concise" | "detailed",
  },
  useResponsesApi: true,
});
