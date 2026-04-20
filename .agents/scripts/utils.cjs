const fsp = require("fs/promises");
const path = require("path");

/**
 * Recursively find all .md files under a directory.
 * @param {string} dir absolute path to search
 * @param {string} [base=""] relative prefix for results
 * @returns {Promise<string[]>}
 */
async function findMdFiles(dir, base = "") {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const tasks = entries.map((entry) => {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      return findMdFiles(path.join(dir, entry.name), rel);
    }
    return entry.name.endsWith(".md") ? [rel] : [];
  });

  return (await Promise.all(tasks)).flat();
}

/**
 * Ensure a symlink exists at linkPath pointing to target.
 * Never overwrites a real file.
 * @param {string} target absolute path to link target
 * @param {string} linkPath absolute path of symlink
 * @param {string} rootDir repo root for readable logs
 * @returns {Promise<"linked" | "unchanged" | "skipped">}
 */
async function ensureSymlink(target, linkPath, rootDir) {
  const rel = path.relative(path.dirname(linkPath), target);

  try {
    const existing = await fsp.readlink(linkPath);

    let targetReachable = true;
    try {
      await fsp.stat(linkPath);
    } catch {
      targetReachable = false;
    }

    if (existing === rel && targetReachable) return "unchanged";

    await fsp.unlink(linkPath);
    if (!targetReachable) {
      console.log(
        `  cleanup: ${path.relative(rootDir, linkPath)} (stale symlink -> ${existing})`,
      );
    }
  } catch {
    try {
      const stat = await fsp.lstat(linkPath);
      if (stat.isSymbolicLink()) {
        await fsp.unlink(linkPath);
      } else {
        console.log(
          `  skip: ${path.relative(rootDir, linkPath)} (real file exists)`,
        );
        return "skipped";
      }
    } catch {
      // Path does not exist.
    }
  }

  await fsp.symlink(rel, linkPath);
  return "linked";
}

/**
 * Ensure a directory exists.
 * @param {string} dir absolute path
 */
async function ensureDir(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch {
    // Swallow non-critical mkdir errors.
  }
}

/**
 * Check whether a path is an existing directory.
 * @param {string} p absolute path
 * @returns {Promise<boolean>}
 */
async function isDirectory(p) {
  try {
    return (await fsp.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check whether a path exists.
 * @param {string} p absolute path
 * @returns {Promise<boolean>}
 */
async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

module.exports = { findMdFiles, ensureSymlink, ensureDir, isDirectory, exists };
