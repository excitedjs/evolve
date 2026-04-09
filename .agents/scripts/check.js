#!/usr/bin/env node

const fsp = require("fs/promises");
const path = require("path");
const { findMdFiles, exists, isDirectory } = require("./utils");

const ROOT = path.resolve(__dirname, "../..");
const AGENT_DIR = path.resolve(__dirname, "..");
const PACKAGES_DIR = path.join(AGENT_DIR, "packages");
const DOC_LINK_RE = /\[[^\]]+\]\((\/\.agents\/[^)]+)\)/g;

function fail(message) {
  throw new Error(message);
}

async function assertExists(targetPath, label) {
  if (!(await exists(targetPath))) {
    fail(`${label} not found: ${path.relative(ROOT, targetPath)}`);
  }
}

async function assertSymlink(linkPath, expectedTarget) {
  let linkValue;
  try {
    linkValue = await fsp.readlink(linkPath);
  } catch {
    fail(`symlink missing: ${path.relative(ROOT, linkPath)}`);
  }

  const actualTarget = path.resolve(path.dirname(linkPath), linkValue);
  if (actualTarget !== expectedTarget) {
    fail(
      `symlink target mismatch: ${path.relative(ROOT, linkPath)} -> ${linkValue}`,
    );
  }
}

async function checkRootProjection() {
  const rootSource = path.join(AGENT_DIR, "root.md");
  await assertExists(rootSource, "root source");
  await assertSymlink(path.join(ROOT, "CLAUDE.md"), rootSource);
  await assertSymlink(path.join(ROOT, "AGENTS.md"), rootSource);
}

async function checkPackageProjection() {
  const mdFiles = await findMdFiles(PACKAGES_DIR);
  for (const rel of mdFiles) {
    const sourcePath = path.join(PACKAGES_DIR, rel);
    const packageDir = path.join(ROOT, "packages", rel.replace(/\.md$/, ""));
    if (!(await isDirectory(packageDir))) {
      fail(`package doc without package dir: ${path.relative(ROOT, sourcePath)}`);
    }

    await assertSymlink(path.join(packageDir, "CLAUDE.md"), sourcePath);
    await assertSymlink(path.join(packageDir, "AGENTS.md"), sourcePath);
  }
}

async function checkInternalLinks() {
  const mdFiles = await findMdFiles(AGENT_DIR);
  for (const rel of mdFiles) {
    const filePath = path.join(AGENT_DIR, rel);
    const content = await fsp.readFile(filePath, "utf8");
    const matches = content.matchAll(DOC_LINK_RE);
    for (const match of matches) {
      const linkedPath = match[1];
      const absolutePath = path.join(ROOT, linkedPath);
      if (!(await exists(absolutePath))) {
        fail(
          `broken doc link in ${path.relative(ROOT, filePath)}: ${linkedPath}`,
        );
      }
    }
  }
}

async function main() {
  await checkRootProjection();
  await checkPackageProjection();
  await checkInternalLinks();
  console.log("agents: check passed");
}

main().catch((error) => {
  console.error(`[agents/check] ${error.message}`);
  process.exitCode = 1;
});
