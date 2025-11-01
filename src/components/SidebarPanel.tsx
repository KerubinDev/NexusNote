import { useContext, useEffect, useState } from "react";
import { VaultContext } from "../contexts/VaultContext";
import { MarkdownParser } from "../utils/markdown";
import { Storage } from "../utils/storage";
import { getNoteNameFromPath } from "../utils/helpers";
import type { Backlink, Heading } from "../types";

interface SidebarPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SidebarPanel({ isVisible, onClose }: SidebarPanelProps) {
  const { currentNote, notes, setCurrentNote } = useContext(VaultContext);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (!currentNote) {
      setBacklinks([]);
      setHeadings([]);
      return;
    }

    // Extrai cabeçalhos
    const extractedHeadings = MarkdownParser.extractHeadings(currentNote.content);
    setHeadings(extractedHeadings);

    // Encontra backlinks
    const findBacklinksAsync = async () => {
      const allNotesWithContent = await getAllNotesContent();
      const noteNameWithoutExt = currentNote.name.replace(".md", "");
      const foundBacklinks = MarkdownParser.findBacklinks(
        noteNameWithoutExt,
        allNotesWithContent
      );
      setBacklinks(foundBacklinks);
    };

    findBacklinksAsync();
  }, [currentNote, notes]);

  const getAllNotesContent = async (): Promise<Array<{ path: string; content: string }>> => {
    const result: Array<{ path: string; content: string }> = [];

    const processNotes = async (items: typeof notes) => {
      for (const item of items) {
        if (item.isDirectory && item.children) {
          await processNotes(item.children);
        } else if (!item.isDirectory) {
          try {
            const loadedNote = await Storage.getNote(item.id);
            if (loadedNote) {
              result.push({ path: loadedNote.path, content: loadedNote.content });
            } else {
              result.push({ path: item.path, content: item.content });
            }
          } catch (error) {
            console.error(`Erro ao ler ${item.path}:`, error);
          }
        }
      }
    };

    await processNotes(notes);
    return result;
  };

  const scrollToHeading = (id: string) => {
    const element = document.querySelector(`#heading-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!isVisible || !currentNote) return null;

  return (
    <div className="w-full md:w-64 glass-strong border-l border-border/50 flex flex-col absolute md:relative inset-0 md:inset-auto z-10 animate-slide-in-right">
      {/* Header mobile */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 md:hidden">
        <h2 className="font-bold text-lg gradient-text">Informações</h2>
        <button
          onClick={onClose}
          className="px-3 py-1.5 glass hover:bg-white/10 rounded-lg text-sm transition-all hover:scale-110"
        >
          ✕
        </button>
      </div>

      <div className="p-4 border-b border-border/30 hidden md:block">
        <h2 className="text-sm font-bold gradient-text">Informações</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Backlinks */}
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">
            Backlinks ({backlinks.length})
          </h3>
          {backlinks.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum backlink encontrado</p>
          ) : (
            <div className="space-y-2">
              {backlinks.map((backlink, index) => (
                <div
                  key={index}
                  className="p-3 glass rounded-xl text-xs hover:bg-white/5 cursor-pointer transition-all hover:scale-105 hover-lift"
                  onClick={async () => {
                    // Navega para a nota que contém o backlink
                    const findNoteByPath = (items: typeof notes, targetPath: string): NoteFile | null => {
                      for (const item of items) {
                        if (item.path === targetPath && !item.isDirectory) {
                          return item;
                        }
                        if (item.children) {
                          const found = findNoteByPath(item.children, targetPath);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    
                    const note = findNoteByPath(notes, backlink.from);
                    if (note) {
                      const loadedNote = await Storage.getNote(note.id);
                      setCurrentNote(loadedNote || note);
                    }
                  }}
                >
                  <div className="font-semibold text-blue-300 mb-1.5">
                    {getNoteNameFromPath(backlink.from)}
                  </div>
                  <div className="text-gray-400 truncate text-xs">{backlink.context}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outline (Cabeçalhos) */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">
            Outline ({headings.length})
          </h3>
          {headings.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum cabeçalho encontrado</p>
          ) : (
            <div className="space-y-1">
              {headings.map((heading, index) => (
                <div
                  key={index}
                  className={`text-xs cursor-pointer hover:text-blue-300 transition-all hover:scale-105 rounded px-2 py-1 ${
                    heading.level === 1
                      ? "font-bold"
                      : heading.level === 2
                      ? "font-semibold"
                      : "font-medium"
                  }`}
                  onClick={() => scrollToHeading(heading.id)}
                  style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                >
                  {heading.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

