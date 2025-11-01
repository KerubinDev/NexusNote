import { useContext, useEffect, useState } from "react";
import { VaultContext } from "../contexts/VaultContext";
import { Storage } from "../utils/storage";
import type { NoteFile } from "../types";

interface TagsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (noteId: string) => void;
}

export default function TagsPanel({ isVisible, onClose, onNavigate }: TagsPanelProps) {
  const { notes, setCurrentNote } = useContext(VaultContext);
  const [tags, setTags] = useState<Map<string, NoteFile[]>>(new Map());

  useEffect(() => {
    if (!isVisible || !notes.length) return;

    const extractTags = async () => {
      const tagMap = new Map<string, NoteFile[]>();
      const allNotes: NoteFile[] = [];

      const processNotes = async (items: typeof notes) => {
        for (const item of items) {
          if (!item.isDirectory) {
            try {
              const loadedNote = await Storage.getNote(item.id);
              if (loadedNote) {
                allNotes.push(loadedNote);
              } else {
                allNotes.push(item);
              }
            } catch {
              allNotes.push(item);
            }
          }
          if (item.children) {
            await processNotes(item.children);
          }
        }
      };

      await processNotes(notes);

      // Extrai tags do formato #tag
      const tagRegex = /#(\w+)/g;
      for (const note of allNotes) {
        const matches = note.content.match(tagRegex);
        if (matches) {
          for (const match of matches) {
            const tag = match.substring(1); // Remove #
            if (!tagMap.has(tag)) {
              tagMap.set(tag, []);
            }
            tagMap.get(tag)!.push(note);
          }
        }
      }

      setTags(tagMap);
    };

    extractTags();
  }, [notes, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white">🏷️ Tags</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Fechar
        </button>
      </div>

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {tags.size === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhuma tag encontrada</p>
            <p className="text-gray-500 text-sm mt-2">Use #tag no conteúdo das suas notas para criar tags</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(tags.entries()).map(([tag, taggedNotes]) => (
              <div
                key={tag}
                className="bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-400 font-semibold text-lg">#{tag}</span>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {taggedNotes.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {taggedNotes.slice(0, 5).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onNavigate(note.id)}
                      className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded cursor-pointer transition-colors"
                    >
                      <div className="text-white text-sm truncate">{note.name}</div>
                    </div>
                  ))}
                  {taggedNotes.length > 5 && (
                    <div className="text-gray-400 text-xs text-center">
                      +{taggedNotes.length - 5} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

