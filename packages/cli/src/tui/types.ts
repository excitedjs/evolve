export type TranscriptMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning: string;
  pending: boolean;
  error?: string;
};
