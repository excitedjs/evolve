import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  loadRuntimeConfigFromEnv,
  parseEvolveConfigFile,
  type ModelConfig,
  type ModelEffort,
} from "@evolve/core";

export interface CliBootstrapConfig {
  configPath: string;
  source: "file" | "env";
  models: ModelConfig[];
  selectedModelId: string;
  effort: ModelEffort;
}

export function getDefaultConfigPath(): string {
  return join(homedir(), ".evolve", "config.json");
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadCliBootstrapConfig(options: {
  configPath?: string;
  explicitConfigPath?: boolean;
} = {}): Promise<CliBootstrapConfig> {
  const configPath = options.configPath ?? getDefaultConfigPath();
  const fileExists = await pathExists(configPath);

  if (!fileExists) {
    if (options.explicitConfigPath) {
      throw new Error(`配置文件不存在: ${configPath}`);
    }

    const runtimeConfig = loadRuntimeConfigFromEnv();
    return {
      configPath,
      source: "env",
      models: [runtimeConfig.model],
      selectedModelId: runtimeConfig.model.id,
      effort: runtimeConfig.effort,
    };
  }

  let rawContent: string;
  try {
    rawContent = await readFile(configPath, "utf8");
  } catch (error) {
    throw new Error(`读取配置文件失败: ${configPath}\n${String(error)}`);
  }

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`配置文件不是合法 JSON: ${configPath}\n${String(error)}`);
  }

  const config = parseEvolveConfigFile(parsedContent);
  return {
    configPath,
    source: "file",
    models: config.models,
    selectedModelId: config.defaultModel,
    effort: config.defaultEffort,
  };
}
