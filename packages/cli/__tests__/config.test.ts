import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCliBootstrapConfig } from "../src/config";

describe("loadCliBootstrapConfig", () => {
  it("能从显式配置文件加载模型列表和默认项", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "evolve-cli-config-"));
    const configPath = join(tempDir, "config.json");

    writeFileSync(
      configPath,
      JSON.stringify({
        defaultModel: "claude-main",
        defaultEffort: "medium",
        models: [
          {
            id: "gpt-main",
            provider: "openai",
            api: "responses",
            model: "gpt-5",
          },
          {
            id: "claude-main",
            provider: "anthropic",
            api: "messages",
            model: "claude-sonnet-4-20250514",
          },
        ],
      }),
    );

    const result = await loadCliBootstrapConfig({
      configPath,
      explicitConfigPath: true,
    });

    assert.equal(result.source, "file");
    assert.equal(result.selectedModelId, "claude-main");
    assert.equal(result.effort, "medium");
    assert.equal(result.models.length, 2);

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("显式传入不存在的配置路径时直接报错", async () => {
    await assert.rejects(
      () =>
        loadCliBootstrapConfig({
          configPath: "/tmp/not-exists-evolve-config.json",
          explicitConfigPath: true,
        }),
      /配置文件不存在/,
    );
  });

  it("默认配置不存在时回退到环境变量模型", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "evolve-cli-home-"));
    const originalHome = process.env.HOME;
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    const originalOpenAIModel = process.env.OPENAI_MODEL;

    process.env.HOME = tempDir;
    process.env.OPENAI_API_KEY = "key";
    process.env.OPENAI_MODEL = "gpt-5";

    const result = await loadCliBootstrapConfig();

    assert.equal(result.source, "env");
    assert.equal(result.models[0].provider, "openai");
    assert.equal(result.selectedModelId, "gpt-5");

    if (originalHome) {
      process.env.HOME = originalHome;
    } else {
      delete process.env.HOME;
    }

    if (originalOpenAIKey) {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    if (originalOpenAIModel) {
      process.env.OPENAI_MODEL = originalOpenAIModel;
    } else {
      delete process.env.OPENAI_MODEL;
    }

    rmSync(tempDir, { recursive: true, force: true });
  });
});
