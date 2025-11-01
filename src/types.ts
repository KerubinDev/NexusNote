export interface NoteFile {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirectory: boolean;
  children?: NoteFile[];
  parentId?: string;
}

export interface Backlink {
  from: string;
  to: string;
  context: string;
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export type StorageType = "indexeddb" | "filesystem";

