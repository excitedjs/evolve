import { createChatModel, loadRuntimeConfigFromEnv } from "./config";

export const defaultRuntimeConfig = loadRuntimeConfigFromEnv();
export const chatModel = createChatModel(defaultRuntimeConfig);
