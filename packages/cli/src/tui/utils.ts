export function drawRule(width: number): string {
  return "─".repeat(Math.max(12, width - 2));
}

export function formatCurrentDirectory(currentDirectory: string): string {
  const homeDirectory = process.env.HOME;
  if (homeDirectory && currentDirectory.startsWith(homeDirectory)) {
    return currentDirectory.replace(homeDirectory, "~");
  }

  return currentDirectory;
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
