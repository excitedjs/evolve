import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCliOptions } from "../src/options";

describe("parseCliOptions", () => {
  it("能解析 config 和 workspace 的短长参数", () => {
    const result = parseCliOptions(
      ["--config", "./configs/dev.json", "-w", "../workspace"],
      "/Users/bytedance/project/app",
    );

    assert.equal(
      result.configPath,
      "/Users/bytedance/project/app/configs/dev.json",
    );
    assert.equal(
      result.workspacePath,
      "/Users/bytedance/project/workspace",
    );
  });

  it("未传参数时保留当前目录并不设置 configPath", () => {
    const result = parseCliOptions([], "/Users/bytedance/project/app");

    assert.equal(result.workspacePath, "/Users/bytedance/project/app");
    assert.equal(result.configPath, undefined);
  });
});
