import { useState, useContext, useEffect, useRef } from "react";
import { VaultContext } from "../contexts/VaultContext";
import { Storage } from "../utils/storage";
import Fuse from "fuse.js";
import type { NoteFile } from "../types";

interface SearchPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SearchPanel({ isVisible, onClose }: SearchPanelProps) {
  const { notes, setCurrentNote } = useContext(VaultContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setSearchQuery("");
      setSearchResults([]);
    } else {
      // Foca no input quando abre
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      setSearching(true);

      // Carrega todo o conteúdo das notas
      const allNotesContent: Array<{ note: NoteFile; content: string }> = [];

      const loadNotes = async (items: typeof notes) => {
        for (const item of items) {
          if (!item.isDirectory) {
            try {
              const loadedNote = await Storage.getNote(item.id);
              if (loadedNote) {
                allNotesContent.push({
                  note: loadedNote,
                  content: loadedNote.content,
                });
              } else {
                allNotesContent.push({
                  note: item,
                  content: item.content,
                });
              }
            } catch {
              allNotesContent.push({
                note: item,
                content: item.content,
              });
            }
          }
          if (item.children) {
            await loadNotes(item.children);
          }
        }
      };

      await loadNotes(notes);

      // Configura Fuse.js para busca
      const fuse = new Fuse(allNotesContent, {
        keys: [
          { name: "note.name", weight: 0.7 },
          { name: "content", weight: 0.3 },
        ],
        threshold: 0.3,
        includeMatches: true,
        includeScore: true,
      });

      const results = fuse.search(searchQuery);
      setSearchResults(results.map((r) => ({ ...r.item, score: r.score, matches: r.matches })));
      setSearching(false);
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, notes]);

  const handleResultClick = async (result: any) => {
    const loadedNote = await Storage.getNote(result.note.id);
    if (loadedNote) {
      setCurrentNote(loadedNote);
    } else {
      setCurrentNote(result.note);
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col animate-fade-in">
      <div className="max-w-3xl w-full mx-auto mt-24 px-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Buscar notas... (Ctrl+K ou Cmd+K)"
            className="w-full px-6 py-4 input-premium text-lg font-medium rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/30 shadow-2xl"
            autoFocus
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="glass-strong rounded-2xl max-h-[500px] overflow-y-auto shadow-2xl">
          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="p-8 text-gray-400 text-center">Nenhum resultado encontrado</div>
          )}

          {searchResults.length === 0 && !searchQuery && (
            <div className="p-8 text-gray-400 text-center">
              <p className="mb-2 text-lg">Digite para buscar</p>
              <p className="text-sm">Busca por nome de nota ou conteúdo</p>
            </div>
          )}

          {searchResults.map((result, index) => (
            <div
              key={index}
              onClick={() => handleResultClick(result)}
              className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/10 last:border-b-0 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-white text-lg">{result.note.name}</div>
                {result.score && (
                  <div className="gradient-primary text-white px-3 py-1 rounded-full text-xs font-bold">
                    {Math.round((1 - result.score) * 100)}%
                  </div>
                )}
              </div>
              {result.matches && result.matches[0] && (
                <div className="text-sm text-gray-400 truncate">
                  {result.matches[0].value.substring(0, 120)}...
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 glass hover:bg-white/10 text-white rounded-xl font-semibold transition-all hover:scale-110"
          >
            ✕ Fechar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

