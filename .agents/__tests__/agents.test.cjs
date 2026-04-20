const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join, relative } = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = join(__dirname, "..", "..");

function createFixtureRepo() {
  const root = mkdtempSync(join(tmpdir(), "agents-link-"));

  mkdirSync(join(root, ".agents", "scripts"), { recursive: true });
  mkdirSync(join(root, ".agents", "packages"), { recursive: true });
  mkdirSync(join(root, ".agents", "rules"), { recursive: true });
  mkdirSync(join(root, "packages", "core"), { recursive: true });

  writeFileSync(join(root, ".agents", "root.md"), "# root\n");
  writeFileSync(join(root, ".agents", "packages", "core.md"), "# core\n");
  writeFileSync(
    join(root, ".agents", "rules", "coding-conventions.md"),
    "- rule\n",
  );
  writeFileSync(join(root, ".agents", "rules", "testing.md"), "# testing\n");
  writeFileSync(
    join(root, ".agents", "scripts", "link.cjs"),
    readFileSync(join(repoRoot, ".agents", "scripts", "link.cjs"), "utf8"),
  );
  writeFileSync(
    join(root, ".agents", "scripts", "utils.cjs"),
    readFileSync(join(repoRoot, ".agents", "scripts", "utils.cjs"), "utf8"),
  );
  writeFileSync(
    join(root, ".agents", "scripts", "check.cjs"),
    readFileSync(join(repoRoot, ".agents", "scripts", "check.cjs"), "utf8"),
  );

  return root;
}

describe("agents scripts", () => {
  it("会为 root 和 package 文档创建相对符号链接", () => {
    const fixtureRoot = createFixtureRepo();
    const result = spawnSync(
      process.execPath,
      [join(".agents", "scripts", "link.cjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, `脚本应成功退出，stderr: ${result.stderr}`);

    const rootClaudePath = join(fixtureRoot, "CLAUDE.md");
    const rootAgentsPath = join(fixtureRoot, "AGENTS.md");
    const packageClaudePath = join(
      fixtureRoot,
      "packages",
      "core",
      "CLAUDE.md",
    );
    const packageAgentsPath = join(
      fixtureRoot,
      "packages",
      "core",
      "AGENTS.md",
    );

    assert.equal(statSync(rootClaudePath).isFile(), true);
    assert.equal(statSync(rootAgentsPath).isFile(), true);
    assert.equal(statSync(packageClaudePath).isFile(), true);
    assert.equal(statSync(packageAgentsPath).isFile(), true);

    assert.equal(readlinkSync(rootClaudePath), ".agents/root.md");
    assert.equal(readlinkSync(rootAgentsPath), ".agents/root.md");
    assert.equal(
      readlinkSync(packageClaudePath),
      relative(
        join(fixtureRoot, "packages", "core"),
        join(fixtureRoot, ".agents", "packages", "core.md"),
      ),
    );
    assert.equal(
      readlinkSync(packageAgentsPath),
      relative(
        join(fixtureRoot, "packages", "core"),
        join(fixtureRoot, ".agents", "packages", "core.md"),
      ),
    );
  });

  it("遇到真实文件时不会覆盖", () => {
    const fixtureRoot = createFixtureRepo();
    const realClaudePath = join(fixtureRoot, "CLAUDE.md");
    writeFileSync(realClaudePath, "real file\n");

    const result = spawnSync(
      process.execPath,
      [join(".agents", "scripts", "link.cjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, `脚本应成功退出，stderr: ${result.stderr}`);
    assert.equal(readFileSync(realClaudePath, "utf8"), "real file\n");
    assert.equal(readlinkSync(join(fixtureRoot, "AGENTS.md")), ".agents/root.md");
    assert.match(result.stdout, /skip: CLAUDE\.md \(real file exists\)/);
  });

  it("check 脚本会验证投影和内部链接", () => {
    const fixtureRoot = createFixtureRepo();
    writeFileSync(
      join(fixtureRoot, ".agents", "root.md"),
      "# root\n\n- [testing](/.agents/rules/testing.md)\n",
    );

    const linkResult = spawnSync(
      process.execPath,
      [join(".agents", "scripts", "link.cjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      },
    );
    assert.equal(linkResult.status, 0, `link 应成功，stderr: ${linkResult.stderr}`);

    const checkResult = spawnSync(
      process.execPath,
      [join(".agents", "scripts", "check.cjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      },
    );
    assert.equal(
      checkResult.status,
      0,
      `check 应成功，stderr: ${checkResult.stderr}`,
    );
    assert.match(checkResult.stdout, /agents: check passed/);
  });

  it("check 脚本会在内部链接断裂时失败", () => {
    const fixtureRoot = createFixtureRepo();
    writeFileSync(
      join(fixtureRoot, ".agents", "root.md"),
      "# root\n\n- [missing](/.agents/rules/missing.md)\n",
    );

    const linkResult = spawnSync(
      process.execPath,
      [join(".agents", "scripts", "link.cjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      },
    );
    assert.equal(linkResult.status, 0, `link 应成功，stderr: ${linkResult.stderr}`);

    const checkResult = spawnSync(
      process.execPath,
      [join(".agents", "scripts", "check.cjs")],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      },
    );
    assert.equal(checkResult.status, 1, "check 应因坏链失败");
    assert.match(checkResult.stderr, /broken doc link/);
  });
});
