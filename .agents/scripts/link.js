#!/usr/bin/env node

const path = require("path");
const {
  findMdFiles,
  ensureSymlink,
  ensureDir,
  isDirectory,
  exists,
} = require("./utils");

const ROOT = path.resolve(__dirname, "../..");
const AGENT_DIR = path.resolve(__dirname, "..");
const PACKAGES_DIR = path.join(AGENT_DIR, "packages");

async function linkRoot() {
  const rootSource = path.join(AGENT_DIR, "root.md");
  if (!(await exists(rootSource))) {
    console.log("root: [skipped, root.md not found]");
    return;
  }

  const [r1, r2] = await Promise.all([
    ensureSymlink(rootSource, path.join(ROOT, "CLAUDE.md"), ROOT),
    ensureSymlink(rootSource, path.join(ROOT, "AGENTS.md"), ROOT),
  ]);
  const result = r1 === "linked" || r2 === "linked" ? "linked" : r1;
  console.log(`root: [${result}]`);
}

async function linkSkills() {
  const skillsSource = path.join(AGENT_DIR, "skills");
  if (!(await exists(skillsSource))) return;

  const targets = [".claude"];
  const results = await Promise.all(
    targets.map(async (dir) => {
      const parentDir = path.join(ROOT, dir);
      await ensureDir(parentDir);
      return ensureSymlink(skillsSource, path.join(parentDir, "skills"), ROOT);
    }),
  );
  const linked = results.filter((r) => r === "linked").length;
  const unchanged = results.filter((r) => r === "unchanged").length;
  console.log(`skills: ${linked} linked, ${unchanged} unchanged`);
}

async function linkRules() {
  const rulesSource = path.join(AGENT_DIR, "rules");
  if (!(await exists(rulesSource))) return;

  const targets = [".claude", ".trae"];
  const results = await Promise.all(
    targets.map(async (dir) => {
      const parentDir = path.join(ROOT, dir);
      await ensureDir(parentDir);
      return ensureSymlink(rulesSource, path.join(parentDir, "rules"), ROOT);
    }),
  );
  const linked = results.filter((r) => r === "linked").length;
  const unchanged = results.filter((r) => r === "unchanged").length;
  console.log(`rules: ${linked} linked, ${unchanged} unchanged`);
}

async function linkPackages() {
  const mdFiles = await findMdFiles(PACKAGES_DIR);

  const results = await Promise.all(
    mdFiles.map(async (rel) => {
      try {
        const packageDir = path.join(ROOT, "packages", rel.replace(/\.md$/, ""));

        if (!(await isDirectory(packageDir))) {
          console.log(`  skip: packages/${rel.replace(/\.md$/, "")} (dir not found)`);
          return "skipped";
        }

        const sourcePath = path.join(PACKAGES_DIR, rel);
        const linkResults = await Promise.all(
          ["CLAUDE.md", "AGENTS.md"].map((name) =>
            ensureSymlink(sourcePath, path.join(packageDir, name), ROOT),
          ),
        );

        if (linkResults.includes("linked")) return "linked";
        if (linkResults.includes("skipped")) return "skipped";
        return "unchanged";
      } catch (error) {
        console.log(`  error: ${rel} (${error.message})`);
        return "skipped";
      }
    }),
  );

  const linked = results.filter((r) => r === "linked").length;
  const unchanged = results.filter((r) => r === "unchanged").length;
  const skipped = results.filter((r) => r === "skipped").length;
  console.log(
    `packages: ${linked} linked, ${unchanged} unchanged, ${skipped} skipped`,
  );
}

async function main() {
  await Promise.all([linkRoot(), linkSkills(), linkRules()]);
  await linkPackages();
}

main().catch((error) => {
  console.error(`[agents/link] unexpected error: ${error.message}`);
});
