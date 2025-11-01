export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getNoteNameFromPath(path: string): string {
  const parts = path.split(/[/\\]/);
  const fileName = parts[parts.length - 1];
  return fileName.replace(".md", "");
}

