import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import type { NoteFile } from "../types";

interface NotesDB extends DBSchema {
  notes: {
    key: string;
    value: NoteFile;
    indexes: { "by-path": string; "by-name": string };
  };
  vaults: {
    key: string;
    value: { name: string; notes: string[] };
  };
}

export class Storage {
  private static db: IDBPDatabase<NotesDB> | null = null;
  private static isNative = Capacitor.isNativePlatform();

  static async init(): Promise<void> {
    if (!this.isNative) {
      this.db = await openDB<NotesDB>("nexusnote-db", 1, {
        upgrade(db) {
          const notesStore = db.createObjectStore("notes", {
            keyPath: "id",
          });
          notesStore.createIndex("by-path", "path");
          notesStore.createIndex("by-name", "name");

          db.createObjectStore("vaults", {
            keyPath: "name",
          });
        },
      });
    }
  }

  static async getAllNotes(): Promise<NoteFile[]> {
    if (this.isNative) {
      return this.getAllNotesFromFilesystem();
    } else {
      if (!this.db) await this.init();
      const tx = this.db!.transaction("notes", "readonly");
      const store = tx.objectStore("notes");
      const allNotes = await store.getAll();
      
      // Reconstrói a hierarquia de pastas para IndexedDB
      return this.buildHierarchy(allNotes);
    }
  }

  private static buildHierarchy(flatNotes: NoteFile[]): NoteFile[] {
    const notesMap = new Map<string, NoteFile>();
    const dirMap = new Map<string, NoteFile>();
    const rootNotes: NoteFile[] = [];

    // Separa diretórios e arquivos, e cria mapa
    for (const note of flatNotes) {
      notesMap.set(note.path, note);
      if (note.isDirectory) {
        dirMap.set(note.path, note);
        if (!note.children) {
          note.children = [];
        }
      } else {
        note.children = undefined;
      }
    }

    // Organiza em hierarquia
    for (const note of flatNotes) {
      if (note.isDirectory) continue; // Diretórios serão processados depois
      
      const pathParts = note.path.split("/").filter(p => p && p !== "nexusnote");
      
      if (pathParts.length === 1) {
        // Nota na raiz (sem pasta)
        rootNotes.push(note);
      } else if (pathParts.length > 1) {
        // Nota dentro de uma pasta
        const folderName = pathParts[0];
        const folderPath = `nexusnote/${folderName}`;
        
        let folder = dirMap.get(folderPath);
        
        // Se a pasta não existe, cria ela
        if (!folder) {
          folder = {
            id: `dir-${folderPath}`,
            path: folderPath,
            name: folderName,
            content: "",
            isDirectory: true,
            children: [],
          };
          dirMap.set(folderPath, folder);
          notesMap.set(folderPath, folder);
          
          // Verifica se já está na raiz
          if (!rootNotes.find(n => n.id === folder.id)) {
            rootNotes.push(folder);
          }
        }
        
        // Adiciona a nota aos children da pasta
        if (!folder.children) {
          folder.children = [];
        }
        if (!folder.children.find(n => n.id === note.id)) {
          folder.children.push(note);
        }
      }
    }

    // Adiciona diretórios órfãos (que não têm notas ainda) à raiz
    for (const [path, dir] of dirMap) {
      if (!rootNotes.find(n => n.id === dir.id)) {
        const pathParts = path.split("/").filter(p => p && p !== "nexusnote");
        if (pathParts.length === 1) {
          rootNotes.push(dir);
        }
      }
    }

    return rootNotes;
  }

  static async getAllNotesFromFilesystem(): Promise<NoteFile[]> {
    try {
      const result = await Filesystem.readdir({
        path: "nexusnote",
        directory: Directory.Data,
      });

      const notes: NoteFile[] = [];

      for (const item of result.files) {
        if (item.type === "directory") {
          const children = await this.readDirectoryRecursive(`nexusnote/${item.name}`);
          notes.push({
            id: `dir-${item.name}`,
            path: `nexusnote/${item.name}`,
            name: item.name,
            content: "",
            isDirectory: true,
            children,
          });
        } else if (item.name.endsWith(".md")) {
          try {
            const content = await Filesystem.readFile({
              path: `nexusnote/${item.name}`,
              directory: Directory.Data,
              encoding: Encoding.UTF8,
            });
            notes.push({
              id: `file-${item.name}`,
              path: `nexusnote/${item.name}`,
              name: item.name,
              content: content.data as string,
              isDirectory: false,
            });
          } catch (error) {
            console.error(`Erro ao ler ${item.name}:`, error);
          }
        }
      }

      return notes;
    } catch (error) {
      // Diretório não existe ainda
      await Filesystem.mkdir({
        path: "nexusnote",
        directory: Directory.Data,
        recursive: true,
      });
      return [];
    }
  }

  private static async readDirectoryRecursive(dirPath: string): Promise<NoteFile[]> {
    try {
      const result = await Filesystem.readdir({
        path: dirPath,
        directory: Directory.Data,
      });

      const notes: NoteFile[] = [];

      for (const item of result.files) {
        if (item.type === "directory") {
          const children = await this.readDirectoryRecursive(`${dirPath}/${item.name}`);
          notes.push({
            id: `dir-${dirPath}/${item.name}`,
            path: `${dirPath}/${item.name}`,
            name: item.name,
            content: "",
            isDirectory: true,
            children,
          });
        } else if (item.name.endsWith(".md")) {
          try {
            const content = await Filesystem.readFile({
              path: `${dirPath}/${item.name}`,
              directory: Directory.Data,
              encoding: Encoding.UTF8,
            });
            notes.push({
              id: `file-${dirPath}/${item.name}`,
              path: `${dirPath}/${item.name}`,
              name: item.name,
              content: content.data as string,
              isDirectory: false,
            });
          } catch (error) {
            console.error(`Erro ao ler ${dirPath}/${item.name}:`, error);
          }
        }
      }

      return notes;
    } catch (error) {
      return [];
    }
  }

  static async getNote(id: string): Promise<NoteFile | null> {
    if (this.isNative) {
      const allNotes = await this.getAllNotesFromFilesystem();
      const findNote = (notes: NoteFile[]): NoteFile | null => {
        for (const note of notes) {
          if (note.id === id) return note;
          if (note.isDirectory && note.children) {
            const found = findNote(note.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findNote(allNotes);
    } else {
      if (!this.db) await this.init();
      return (await this.db!.get("notes", id)) || null;
    }
  }

  static async saveNote(note: NoteFile): Promise<void> {
    if (this.isNative) {
      await Filesystem.writeFile({
        path: note.path,
        directory: Directory.Data,
        data: note.content,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } else {
      if (!this.db) await this.init();
      await this.db!.put("notes", note);
    }
  }

  static async createNote(note: NoteFile): Promise<void> {
    if (this.isNative) {
      await Filesystem.writeFile({
        path: note.path,
        directory: Directory.Data,
        data: note.content || "",
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } else {
      if (!this.db) await this.init();
      await this.db!.add("notes", note);
    }
  }

  static async deleteNote(note: NoteFile): Promise<void> {
    if (this.isNative) {
      if (note.isDirectory) {
        await Filesystem.rmdir({
          path: note.path,
          directory: Directory.Data,
          recursive: true,
        });
      } else {
        await Filesystem.deleteFile({
          path: note.path,
          directory: Directory.Data,
        });
      }
    } else {
      if (!this.db) await this.init();
      await this.db!.delete("notes", note.id);
    }
  }

  static async createDirectory(path: string, name: string): Promise<void> {
    if (this.isNative) {
      await Filesystem.mkdir({
        path: `${path}/${name}`,
        directory: Directory.Data,
        recursive: true,
      });
    } else {
      // Em IndexedDB, criamos uma nota com isDirectory = true
      const dirNote: NoteFile = {
        id: `dir-${path}/${name}`,
        path: `${path}/${name}`,
        name,
        content: "",
        isDirectory: true,
        children: [],
      };
      if (!this.db) await this.init();
      await this.db!.add("notes", dirNote);
    }
  }

  static async renameNote(oldNote: NoteFile, newName: string): Promise<void> {
    if (this.isNative) {
      const parentPath = oldNote.path.substring(0, oldNote.path.lastIndexOf("/"));
      const newPath = `${parentPath}/${newName}`;
      
      if (oldNote.isDirectory) {
        // Para diretórios, precisamos renomear recursivamente
        await Filesystem.readdir({
          path: oldNote.path,
          directory: Directory.Data,
        });
        // Nota: Capacitor não tem rename nativo, então criamos novo e deletamos antigo
      } else {
        const content = await Filesystem.readFile({
          path: oldNote.path,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        
        await Filesystem.writeFile({
          path: newPath,
          directory: Directory.Data,
          data: content.data as string,
          encoding: Encoding.UTF8,
        });
        
        await Filesystem.deleteFile({
          path: oldNote.path,
          directory: Directory.Data,
        });
      }
    } else {
      if (!this.db) await this.init();
      const updatedNote = {
        ...oldNote,
        name: newName,
        path: oldNote.path.substring(0, oldNote.path.lastIndexOf("/")) + "/" + newName,
      };
      await this.db!.put("notes", updatedNote);
    }
  }

  static getStorageType(): "indexeddb" | "filesystem" {
    return this.isNative ? "filesystem" : "indexeddb";
  }
}

