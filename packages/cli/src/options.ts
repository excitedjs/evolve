import { resolve } from "node:path";
import yargs from "yargs";

export interface CliOptions {
  configPath?: string;
  workspacePath: string;
}

export function parseCliOptions(
  argv: string[],
  currentWorkingDirectory: string,
): CliOptions {
  const parsed = yargs(argv)
    .scriptName("evolve")
    .exitProcess(false)
    .help(false)
    .version(false)
    .strict()
    .option("config", {
      alias: "c",
      type: "string",
      description: "显式指定配置文件路径",
    })
    .option("workspace", {
      alias: "w",
      type: "string",
      description: "指定工作目录后再启动 TUI",
    })
    .parseSync();

  return {
    configPath: parsed.config
      ? resolve(currentWorkingDirectory, parsed.config)
      : undefined,
    workspacePath: parsed.workspace
      ? resolve(currentWorkingDirectory, parsed.workspace)
      : currentWorkingDirectory,
  };
}
