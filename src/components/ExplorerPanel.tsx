import { useState, useContext, useRef } from "react";
import { VaultContext } from "../contexts/VaultContext";
import { Storage } from "../utils/storage";
import { MarkdownParser } from "../utils/markdown";
import { generateId } from "../utils/helpers";
import type { NoteFile } from "../types";

interface ExplorerPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ExplorerPanel({ isVisible, onClose }: ExplorerPanelProps) {
  const { notes, setCurrentNote, refreshVault, storageType } = useContext(VaultContext);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (file: NoteFile) => {
    if (file.isDirectory) {
      toggleFolder(file.path);
      setSelectedFolder(file.path); // Define a pasta selecionada
      return;
    }

    // Recarrega o conteúdo do arquivo
    const loadedNote = await Storage.getNote(file.id);
    if (loadedNote) {
      setCurrentNote(loadedNote);
    } else {
      setCurrentNote(file);
    }
    setSelectedFolder(null); // Limpa seleção ao abrir nota
  };

  const handleNewNote = async (folderPath?: string) => {
    const timestamp = Date.now();
    const fileName = `Nova Nota ${timestamp}.md`;
    const noteName = fileName.replace(".md", "");
    
    // Se há uma pasta selecionada, cria a nota dentro dela
    const targetFolder = folderPath || selectedFolder;
    let path: string;
    
    if (targetFolder) {
      // Remove 'nexusnote/' do início se estiver presente
      let cleanFolderPath = targetFolder.replace(/^nexusnote\//, "");
      
      // Garante que o path está correto para ambos os storage types
      path = `nexusnote/${cleanFolderPath}/${noteName}.md`;
    } else {
      // Cria na raiz
      path = `nexusnote/${noteName}.md`;
    }
    
    const id = generateId();

    const newNote: NoteFile = {
      id,
      path,
      name: fileName,
      content: "",
      isDirectory: false,
      parentId: targetFolder || undefined,
    };

    try {
      await Storage.createNote(newNote);
      await refreshVault();
      
      // Recarrega a nota recém-criada do storage para garantir que está sincronizada
      const allNotes = await Storage.getAllNotes();
      const findNewNote = (items: typeof allNotes): NoteFile | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.isDirectory && item.children) {
            const found = findNewNote(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const loadedNote = findNewNote(allNotes);
      if (loadedNote) {
        setCurrentNote(loadedNote);
      } else {
        setCurrentNote(newNote);
      }
      
      // Expande a pasta se necessário
      if (targetFolder) {
        setExpandedFolders(new Set([...expandedFolders, targetFolder]));
      }
    } catch (error) {
      console.error("Erro ao criar nota:", error);
      alert("Erro ao criar nota. Tente novamente.");
    }
  };

  const handleNewFolder = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `Nova Pasta ${timestamp}`;
    const path = `nexusnote/${folderName}`;

    await Storage.createDirectory("nexusnote", folderName);
    await refreshVault();
    setExpandedFolders(new Set([...expandedFolders, path]));
  };

  const handleDelete = async (item: NoteFile) => {
    if (!confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
      return;
    }

    try {
      await Storage.deleteNote(item);
      await refreshVault();
      setCurrentNote(null);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao excluir item");
    }
  };

  const startRename = (item: NoteFile) => {
    setRenamingItem(item.id);
    setNewName(item.name);
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  };

  const handleRename = async () => {
    if (!renamingItem || !newName.trim()) {
      setRenamingItem(null);
      return;
    }

    try {
      const item = notes.find((n) => n.id === renamingItem);
      if (!item) return;

      await Storage.renameNote(item, newName.trim());
      await refreshVault();
      setRenamingItem(null);
    } catch (error) {
      console.error("Erro ao renomear:", error);
      alert("Erro ao renomear item");
    }
  };

  const renderFileTree = (items: NoteFile[], depth: number = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isRenaming = renamingItem === item.id;

      return (
        <div key={item.id} className="select-none">
          <div
            className={`flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer group text-sm rounded-lg transition-all hover:scale-[1.02] ${
              depth > 0 ? "" : ""
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {item.isDirectory ? (
              <button
                className="text-sm w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileClick(item);
                }}
                title="Clique para expandir/colapsar"
              >
                {isExpanded ? "📂" : "📁"}
              </button>
            ) : (
              <span className="text-sm w-5">📄</span>
            )}

            {isRenaming ? (
              <input
                ref={renameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenamingItem(null);
                }}
                className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span
                  className="flex-1 truncate"
                  onClick={() => handleFileClick(item)}
                  onDoubleClick={() => {
                    if (!item.isDirectory) startRename(item);
                  }}
                >
                  {item.name}
                </span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(item);
                    }}
                    className="text-xs px-1.5 py-0.5 hover:bg-gray-600 rounded"
                    title="Renomear"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="text-xs px-1.5 py-0.5 hover:bg-gray-600 rounded"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>

          {item.isDirectory && isExpanded && (
            <div>
              {/* Botão para criar nota dentro da pasta */}
              <div
                className="flex items-center gap-2 px-3 py-2 gradient-blue/20 hover:gradient-blue/30 cursor-pointer group text-xs rounded-lg transition-all hover:scale-105 backdrop-blur-sm border border-blue-500/30"
                style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNewNote(item.path);
                }}
              >
                <span className="text-blue-300 font-bold">+</span>
                <span className="text-blue-300 font-medium">Criar nota aqui</span>
              </div>
              {item.children && (
                <div>{renderFileTree(item.children, depth + 1)}</div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  if (!isVisible) return null;

  return (
    <div className="w-full md:w-64 glass-strong border-r border-border/50 flex flex-col absolute md:relative inset-0 md:inset-auto z-10 animate-slide-in-left">
      {/* Header mobile */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 md:hidden">
        <h2 className="font-bold text-lg gradient-text">Explorador</h2>
        <button
          onClick={onClose}
          className="px-3 py-1.5 glass hover:bg-white/10 rounded-lg text-sm transition-all hover:scale-110"
        >
          ✕
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3 border-b border-border/30 flex gap-2 flex-wrap">
        <button
          onClick={() => handleNewNote()}
          className="flex-1 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          title="Nova Nota"
        >
          ✨ + Nota
        </button>
        <button
          onClick={handleNewFolder}
          className="flex-1 px-4 py-2.5 glass hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all hover:scale-105 md:flex hidden"
          title="Nova Pasta"
        >
          📁 + Pasta
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {notes.length === 0 ? (
          <div className="text-center text-sm text-gray-500 mt-4">
            Nenhum arquivo encontrado
          </div>
        ) : (
          <div>{renderFileTree(notes)}</div>
        )}
      </div>
    </div>
  );
}

