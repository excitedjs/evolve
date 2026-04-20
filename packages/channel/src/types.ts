export interface RequestMessage {
  type: "message";
  role: "user" | "assistant" | "system" | "developer";
  content: string;
}

export interface FunctionCallOutput {
  type: "function_call_output";
  call_id: string;
  output: string;
}

export type InputItem = RequestMessage | FunctionCallOutput;

export interface OpenResponsesRequest {
  model?: string;
  input: string | InputItem[];
  instructions?: string;
  stream?: boolean;
  tools?: ToolDefinition[];
  max_output_tokens?: number;
  user?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface ResponseOutput {
  id: string;
  object: "response";
  status: "completed" | "failed" | "in_progress";
  output: OutputItem[];
}

export interface OutputItem {
  type: "message";
  role: "assistant";
  content: ContentPart[];
}

export interface ContentPart {
  type: "output_text";
  text: string;
}
