import { stat } from "node:fs/promises";
import { hideBin } from "yargs/helpers";
import React from "react";
import { render } from "ink";
import { App } from "./app";
import { loadCliBootstrapConfig } from "./config";
import { parseCliOptions } from "./options";

async function ensureDirectory(targetPath: string, label: string) {
  let stats;
  try {
    stats = await stat(targetPath);
  } catch {
    throw new Error(`${label} 不存在: ${targetPath}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`${label} 不是目录: ${targetPath}`);
  }
}

async function main() {
  const invocationCwd = process.cwd();
  const options = parseCliOptions(hideBin(process.argv), invocationCwd);

  await ensureDirectory(options.workspacePath, "工作目录");
  process.chdir(options.workspacePath);

  const bootstrapConfig = await loadCliBootstrapConfig({
    configPath: options.configPath,
    explicitConfigPath: Boolean(options.configPath),
  });

  const instance = render(React.createElement(App, bootstrapConfig), {
    exitOnCtrlC: false,
  });

  await instance.waitUntilExit();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
