import { createContext } from "react";
import type { NoteFile, StorageType } from "../types";

export interface VaultContextType {
  vaultName: string;
  currentNote: NoteFile | null;
  setCurrentNote: (note: NoteFile | null) => void;
  notes: NoteFile[];
  setNotes: (notes: NoteFile[]) => void;
  refreshVault: () => void;
  storageType: StorageType;
}

export const VaultContext = createContext<VaultContextType>({
  vaultName: "",
  currentNote: null,
  setCurrentNote: () => {},
  notes: [],
  setNotes: () => {},
  refreshVault: () => {},
  storageType: "indexeddb",
});

