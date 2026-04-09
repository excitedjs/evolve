import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// config.ts 在模块加载时就校验环境变量并抛出错误，
// 无法在同一进程内重置模块缓存测试不同 env 组合，
// 因此用子进程隔离每个测试场景。
const defaultsPath = resolve(__dirname, "../src/defaults");
const tsxCjsPath = require.resolve("tsx/cjs");

function runConfig(env: Record<string, string | undefined>) {
  return spawnSync(
    process.execPath,
    ["--require", tsxCjsPath, "-e", `require(${JSON.stringify(defaultsPath)})`],
    {
      env: { PATH: process.env.PATH, ...env },
      encoding: "utf8",
    },
  );
}

const baseEnv = {
  OPENAI_API_KEY: "key",
  OPENAI_MODEL: "model",
};

describe("config 环境变量校验", () => {
  it("缺少 OPENAI_API_KEY 时抛出错误", () => {
    const { OPENAI_API_KEY: _, ...rest } = baseEnv;
    const result = runConfig(rest);
    assert.ok(
      result.stderr.includes("Missing env: OPENAI_API_KEY"),
      `期望 stderr 包含 'Missing env: OPENAI_API_KEY'，实际: ${result.stderr}`,
    );
  });

  it("缺少 OPENAI_MODEL 时抛出错误", () => {
    const { OPENAI_MODEL: _, ...rest } = baseEnv;
    const result = runConfig(rest);
    assert.ok(
      result.stderr.includes("Missing env: OPENAI_MODEL"),
      `期望 stderr 包含 'Missing env: OPENAI_MODEL'，实际: ${result.stderr}`,
    );
  });

  it("所有必填变量存在时加载成功", () => {
    const result = runConfig(baseEnv);
    assert.equal(
      result.status,
      0,
      `期望进程正常退出，stderr: ${result.stderr}`,
    );
  });

  it("切到 Anthropic provider 时按 Anthropic 环境变量校验", () => {
    const result = runConfig({
      EVOLVE_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "anthropic-key",
      ANTHROPIC_MODEL: "claude-sonnet-4-20250514",
    });

    assert.equal(
      result.status,
      0,
      `期望 Anthropic 配置加载成功，stderr: ${result.stderr}`,
    );
  });
});
