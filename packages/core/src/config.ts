import { ChatAnthropic } from "@langchain/anthropic";
import {
  ChatOpenAICompletions,
  ChatOpenAIResponses,
} from "@langchain/openai";

export const MODEL_EFFORTS = ["low", "medium", "high"] as const;
export type ModelEffort = (typeof MODEL_EFFORTS)[number];

export const OPENAI_API_MODES = ["chat-completions", "responses"] as const;
export type OpenAIApiMode = (typeof OPENAI_API_MODES)[number];

export const ANTHROPIC_API_MODES = ["messages"] as const;
export type AnthropicApiMode = (typeof ANTHROPIC_API_MODES)[number];

export type OpenAIReasoningSummary = "auto" | "concise" | "detailed";
export type AnthropicThinkingMode = "adaptive" | "disabled";

interface ModelConfigBase {
  id: string;
  label?: string;
  model: string;
  apiKey?: string;
  apiKeyEnv?: string;
  baseURL?: string;
  baseURLEnv?: string;
}

export interface OpenAIModelConfig extends ModelConfigBase {
  provider: "openai";
  api: OpenAIApiMode;
  reasoningSummary?: OpenAIReasoningSummary;
  webSearch?: boolean;
}

export interface AnthropicModelConfig extends ModelConfigBase {
  provider: "anthropic";
  api: AnthropicApiMode;
  maxTokens?: number;
  thinking?: AnthropicThinkingMode;
}

export type ModelConfig = OpenAIModelConfig | AnthropicModelConfig;

export interface EvolveConfigFile {
  defaultModel: string;
  defaultEffort: ModelEffort;
  models: ModelConfig[];
}

export interface ConversationRuntimeConfig {
  model: ModelConfig;
  effort: ModelEffort;
}

export type SupportedChatModel =
  | ChatOpenAICompletions
  | ChatOpenAIResponses
  | ChatAnthropic;

const OPENAI_REASONING_SUMMARIES = ["auto", "concise", "detailed"] as const;
const ANTHROPIC_THINKING_MODES = ["adaptive", "disabled"] as const;
const DEFAULT_MODEL_EFFORT: ModelEffort = "high";
const DEFAULT_ANTHROPIC_MAX_TOKENS = 4_096;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} 必须是非空字符串`);
  }
  return value;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 必须是非空字符串`);
  }
  return value;
}

function readOptionalBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new Error(`${key} 必须是布尔值`);
  }
  return value;
}

function readOptionalPositiveInteger(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  if (value === undefined) {
    return undefined;
  }
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${key} 必须是正整数`);
  }
  return value;
}

function parseModelEffort(value: unknown, label: string): ModelEffort {
  if (typeof value !== "string" || !MODEL_EFFORTS.includes(value as ModelEffort)) {
    throw new Error(
      `${label} 必须是 ${MODEL_EFFORTS.map((item) => `"${item}"`).join(" / ")}`,
    );
  }
  return value as ModelEffort;
}

function parseOpenAIApiMode(value: unknown): OpenAIApiMode {
  if (
    typeof value !== "string" ||
    !OPENAI_API_MODES.includes(value as OpenAIApiMode)
  ) {
    throw new Error(
      `openai.api 必须是 ${OPENAI_API_MODES.map((item) => `"${item}"`).join(" / ")}`,
    );
  }
  return value as OpenAIApiMode;
}

function parseAnthropicApiMode(value: unknown): AnthropicApiMode {
  if (value !== "messages") {
    throw new Error('anthropic.api 当前只支持 "messages"');
  }
  return value;
}

function parseOpenAIReasoningSummary(
  value: unknown,
): OpenAIReasoningSummary | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    typeof value !== "string" ||
    !OPENAI_REASONING_SUMMARIES.includes(value as OpenAIReasoningSummary)
  ) {
    throw new Error(
      `reasoningSummary 必须是 ${OPENAI_REASONING_SUMMARIES.map((item) => `"${item}"`).join(" / ")}`,
    );
  }
  return value as OpenAIReasoningSummary;
}

function parseAnthropicThinkingMode(
  value: unknown,
): AnthropicThinkingMode | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    typeof value !== "string" ||
    !ANTHROPIC_THINKING_MODES.includes(value as AnthropicThinkingMode)
  ) {
    throw new Error(
      `thinking 必须是 ${ANTHROPIC_THINKING_MODES.map((item) => `"${item}"`).join(" / ")}`,
    );
  }
  return value as AnthropicThinkingMode;
}

function parseModelConfig(value: unknown, index: number): ModelConfig {
  if (!isRecord(value)) {
    throw new Error(`models[${index}] 必须是对象`);
  }

  const provider = readRequiredString(value, "provider", `models[${index}].provider`);
  const base = {
    id: readRequiredString(value, "id", `models[${index}].id`),
    label: readOptionalString(value, "label"),
    model: readRequiredString(value, "model", `models[${index}].model`),
    apiKey: readOptionalString(value, "apiKey"),
    apiKeyEnv: readOptionalString(value, "apiKeyEnv"),
    baseURL: readOptionalString(value, "baseURL"),
    baseURLEnv: readOptionalString(value, "baseURLEnv"),
  };

  if (provider === "openai") {
    return {
      ...base,
      provider,
      api: parseOpenAIApiMode(value.api),
      reasoningSummary: parseOpenAIReasoningSummary(value.reasoningSummary),
      webSearch: readOptionalBoolean(value, "webSearch"),
    };
  }

  if (provider === "anthropic") {
    return {
      ...base,
      provider,
      api: parseAnthropicApiMode(value.api),
      maxTokens: readOptionalPositiveInteger(value, "maxTokens"),
      thinking: parseAnthropicThinkingMode(value.thinking),
    };
  }

  throw new Error('provider 必须是 "openai" 或 "anthropic"');
}

export function parseEvolveConfigFile(input: unknown): EvolveConfigFile {
  if (!isRecord(input)) {
    throw new Error("配置文件根节点必须是对象");
  }

  const rawModels = input.models;
  if (!Array.isArray(rawModels) || rawModels.length === 0) {
    throw new Error("models 必须是非空数组");
  }

  const models = rawModels.map((item, index) => parseModelConfig(item, index));
  const defaultModel =
    readOptionalString(input, "defaultModel") ?? models[0].id;

  if (!models.some((model) => model.id === defaultModel)) {
    throw new Error(`defaultModel "${defaultModel}" 不存在于 models 列表中`);
  }

  const defaultEffort =
    input.defaultEffort === undefined
      ? DEFAULT_MODEL_EFFORT
      : parseModelEffort(input.defaultEffort, "defaultEffort");

  return {
    defaultModel,
    defaultEffort,
    models,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}

function readOptionalEnvNumber(name: string): number | undefined {
  const value = readOptionalEnv(name);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid env: ${name} must be a positive integer`);
  }
  return parsed;
}

function resolveConfiguredString(
  directValue: string | undefined,
  envName: string | undefined,
  defaultEnvName: string,
  required: boolean,
  label: string,
): string | undefined {
  if (directValue) {
    return directValue;
  }

  const configuredEnvName = envName ?? defaultEnvName;
  const envValue = readOptionalEnv(configuredEnvName);
  if (envValue) {
    return envValue;
  }

  if (required) {
    throw new Error(`Missing config: ${label}`);
  }

  return undefined;
}

export function loadRuntimeConfigFromEnv(): ConversationRuntimeConfig {
  const provider = readOptionalEnv("EVOLVE_PROVIDER") ?? "openai";
  const effort = parseModelEffort(
    readOptionalEnv("REASONING_EFFORT") ?? DEFAULT_MODEL_EFFORT,
    "REASONING_EFFORT",
  );

  if (provider === "anthropic") {
    return {
      effort,
      model: {
        id: requireEnv("ANTHROPIC_MODEL"),
        provider: "anthropic",
        api: "messages",
        model: requireEnv("ANTHROPIC_MODEL"),
        apiKey: requireEnv("ANTHROPIC_API_KEY"),
        baseURL: readOptionalEnv("ANTHROPIC_BASE_URL"),
        maxTokens:
          readOptionalEnvNumber("ANTHROPIC_MAX_TOKENS") ??
          DEFAULT_ANTHROPIC_MAX_TOKENS,
        thinking:
          parseAnthropicThinkingMode(readOptionalEnv("ANTHROPIC_THINKING")) ??
          "adaptive",
      },
    };
  }

  return {
    effort,
    model: {
      id: requireEnv("OPENAI_MODEL"),
      provider: "openai",
      api:
        parseOpenAIApiMode(readOptionalEnv("OPENAI_API_MODE") ?? "responses"),
      model: requireEnv("OPENAI_MODEL"),
      apiKey: requireEnv("OPENAI_API_KEY"),
      baseURL: readOptionalEnv("OPENAI_BASE_URL"),
      reasoningSummary:
        parseOpenAIReasoningSummary(readOptionalEnv("REASONING_SUMMARY")) ??
        "auto",
      webSearch:
        (readOptionalEnv("OPENAI_ENABLE_WEB_SEARCH") ?? "true") !== "false",
    },
  };
}

function resolveOpenAIModelConfig(
  config: OpenAIModelConfig,
  effort: ModelEffort,
): ChatOpenAICompletions | ChatOpenAIResponses {
  const apiKey = resolveConfiguredString(
    config.apiKey,
    config.apiKeyEnv,
    "OPENAI_API_KEY",
    true,
    `${config.id}.apiKey`,
  );
  const baseURL = resolveConfiguredString(
    config.baseURL,
    config.baseURLEnv,
    "OPENAI_BASE_URL",
    false,
    `${config.id}.baseURL`,
  );

  const commonFields = {
    model: config.model,
    configuration: {
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    },
    reasoning: {
      effort,
      ...(config.reasoningSummary ? { summary: config.reasoningSummary } : {}),
    },
  };

  if (config.api === "responses") {
    return new ChatOpenAIResponses(commonFields);
  }

  return new ChatOpenAICompletions(commonFields);
}

function resolveAnthropicModelConfig(
  config: AnthropicModelConfig,
  effort: ModelEffort,
): ChatAnthropic {
  const apiKey = resolveConfiguredString(
    config.apiKey,
    config.apiKeyEnv,
    "ANTHROPIC_API_KEY",
    true,
    `${config.id}.apiKey`,
  );
  const baseURL = resolveConfiguredString(
    config.baseURL,
    config.baseURLEnv,
    "ANTHROPIC_BASE_URL",
    false,
    `${config.id}.baseURL`,
  );

  return new ChatAnthropic({
    model: config.model,
    anthropicApiKey: apiKey,
    ...(baseURL ? { anthropicApiUrl: baseURL } : {}),
    maxTokens: config.maxTokens ?? DEFAULT_ANTHROPIC_MAX_TOKENS,
    thinking: { type: config.thinking ?? "adaptive" },
    outputConfig: {
      effort,
    },
  });
}

export function createChatModel(
  runtimeConfig: ConversationRuntimeConfig,
): SupportedChatModel {
  if (runtimeConfig.model.provider === "openai") {
    return resolveOpenAIModelConfig(runtimeConfig.model, runtimeConfig.effort);
  }

  return resolveAnthropicModelConfig(runtimeConfig.model, runtimeConfig.effort);
}

export function getModelLabel(model: ModelConfig): string {
  return model.label ?? model.id;
}
