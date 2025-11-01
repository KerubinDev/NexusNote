import { useState, useContext, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VaultContext } from "../contexts/VaultContext";
import { Storage } from "../utils/storage";
import { MarkdownParser } from "../utils/markdown";
import { generateId } from "../utils/helpers";
import type { NoteFile } from "../types";

// Expõe função global para links wiki
(window as any).handleWikiLinkClick = (noteName: string) => {
  window.dispatchEvent(new CustomEvent("wiki-link-click", { detail: noteName }));
};

interface EditorPanelProps {
  onToggleExplorer: () => void;
  onToggleSidebar: () => void;
}

export default function EditorPanel({ onToggleExplorer, onToggleSidebar }: EditorPanelProps) {
  const { currentNote, setCurrentNote, notes, refreshVault, storageType } = useContext(VaultContext);
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tabs, setTabs] = useState<NoteFile[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content);
      
      // Sempre abre em modo de edição
      setIsEditing(true);
      
      // Adiciona à lista de abas se não estiver lá
      setTabs((prev) => {
        const exists = prev.find((tab) => tab.id === currentNote.id);
        if (!exists) {
          return [...prev, currentNote];
        }
        return prev;
      });
      const tabIndex = tabs.findIndex((tab) => tab.id === currentNote.id);
      setActiveTabIndex(tabIndex >= 0 ? tabIndex : tabs.length);
    }
  }, [currentNote]);

  // Escuta cliques em links wiki
  useEffect(() => {
    const handleWikiLink = async (event: CustomEvent) => {
      const noteName = event.detail;
      if (!noteName) return;

      // Função recursiva para buscar nota
      const findNoteInTree = async (items: typeof notes): Promise<NoteFile | null> => {
        for (const item of items) {
          if (item.isDirectory && item.children) {
            const found = await findNoteInTree(item.children);
            if (found) return found;
          } else if (!item.isDirectory) {
            const nameWithoutExt = item.name.replace(".md", "").toLowerCase().trim();
            const searchName = noteName.toLowerCase().trim();
            
            if (nameWithoutExt === searchName) {
              // Carrega o conteúdo atualizado
              try {
                const loadedNote = await Storage.getNote(item.id);
                return loadedNote || item;
              } catch {
                return item;
              }
            }
          }
        }
        return null;
      };

      let targetNote = await findNoteInTree(notes);

      // Se a nota não existe, cria ela
      if (!targetNote) {
        const filePath = MarkdownParser.noteNameToPath(noteName, storageType);
        const id = generateId();
        targetNote = {
          id,
          path: filePath,
          name: `${noteName}.md`,
          content: `# ${noteName}\n\n`,
          isDirectory: false,
        };
        
        try {
          await Storage.createNote(targetNote);
          await refreshVault();
        } catch (error) {
          console.error("Erro ao criar nota:", error);
          alert("Erro ao criar nota");
          return;
        }
      }

      // Abre a nota e atualiza tabs
      setCurrentNote(targetNote);
      setTabs((prev) => {
        const exists = prev.find((tab) => tab.id === targetNote!.id);
        if (!exists && targetNote) {
          return [...prev, targetNote];
        }
        return prev;
      });
    };

    const handler = handleWikiLink as EventListener;
    window.addEventListener("wiki-link-click" as any, handler);
    return () => {
      window.removeEventListener("wiki-link-click" as any, handler);
    };
  }, [notes, setCurrentNote, refreshVault, storageType]);

  const handleSave = async () => {
    if (!currentNote) return;

    try {
      const updatedNote = { ...currentNote, content };
      await Storage.saveNote(updatedNote);
      setCurrentNote(updatedNote);
      
      // Feedback visual
      const saveBtn = document.querySelector('[title*="Salvar"]');
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "✓";
        setTimeout(() => {
          saveBtn.textContent = originalText;
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar nota");
    }
  };

  // Escuta evento de salvar por atalho
  useEffect(() => {
    const handleSaveEvent = () => {
      if (currentNote && content !== undefined) {
        const save = async () => {
          try {
            const updatedNote = { ...currentNote, content };
            await Storage.saveNote(updatedNote);
            setCurrentNote(updatedNote);
          } catch (error) {
            console.error("Erro ao salvar:", error);
          }
        };
        save();
      }
    };
    window.addEventListener("save-note" as any, handleSaveEvent);
    return () => window.removeEventListener("save-note" as any, handleSaveEvent);
  }, [currentNote, content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Auto-save após 2 segundos de inatividade
    if (currentNote) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        const updatedNote = { ...currentNote, content: newContent };
        Storage.saveNote(updatedNote).catch(console.error);
        setCurrentNote(updatedNote);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTabClick = async (tab: NoteFile, index: number) => {
    const loadedNote = await Storage.getNote(tab.id);
    if (loadedNote) {
      setCurrentNote(loadedNote);
      setIsEditing(true); // Sempre abre em modo de edição
      setActiveTabIndex(index);
      setTabs((prev) =>
        prev.map((t) => (t.id === tab.id ? loadedNote : t))
      );
    }
  };

  const handleTabClose = (e: React.MouseEvent, tab: NoteFile, index: number) => {
    e.stopPropagation();
    setTabs((prev) => prev.filter((t) => t.id !== tab.id));
    
    if (activeTabIndex === index && tabs.length > 1) {
      const newIndex = index > 0 ? index - 1 : 0;
      const newTab = tabs[newIndex];
      if (newTab) {
        handleTabClick(newTab, newIndex);
      }
    }
  };

  const renderMarkdownContent = () => {
    // Processa links wiki
    const processedContent = content.replace(
      /\[\[([^\]]+)\]\]/g,
      (match, linkText) => {
        const noteName = linkText.split("|")[0].trim();
        const displayText = linkText.includes("|") ? linkText.split("|")[1].trim() : noteName;
        return `[${displayText}](wiki://${noteName})`;
      }
    );

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("wiki://")) {
              const noteName = href.replace("wiki://", "");
              return (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    (window as any).handleWikiLinkClick(noteName);
                  }}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {children}
                </a>
              );
            }
            return <a href={href}>{children}</a>;
          },
        }}
        className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-code:text-pink-400 prose-pre:bg-gray-800"
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  if (!currentNote && tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-gray-500">
        <div className="text-center px-4">
          <p className="text-lg mb-2">Nenhuma nota aberta</p>
          <p className="text-sm mb-4">Selecione uma nota no explorador ou crie uma nova</p>
          {isMobile && (
            <button
              onClick={onToggleExplorer}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Abrir Explorador
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background relative">
      {/* Abas */}
      {tabs.length > 0 && (
        <div className="flex glass border-b border-border/30 overflow-x-auto">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2.5 border-r border-border/30 cursor-pointer whitespace-nowrap transition-all ${
                index === activeTabIndex
                  ? "glass-strong border-b-2 border-b-accent"
                  : "glass hover:bg-white/5"
              }`}
              onClick={() => handleTabClick(tab, index)}
            >
              <span className="truncate max-w-xs text-sm font-medium">{tab.name}</span>
              <button
                onClick={(e) => handleTabClose(e, tab, index)}
                className="hover:bg-red-500/20 rounded-lg px-2 py-0.5 text-xs ml-1 transition-all hover:scale-110"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 glass">
        <div className="flex gap-2 flex-wrap">
          {isMobile && (
            <button
              onClick={onToggleExplorer}
              className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110"
              title="Explorador"
            >
              ☰
            </button>
          )}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-search"));
            }}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110 hover-glow"
            title="Buscar (Ctrl+K)"
          >
            🔍
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-graph"));
            }}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110 hover-glow"
            title="Graph View (Ctrl+G)"
          >
            🕸️
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-dashboard"));
            }}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110 hover-glow"
            title="Dashboard (Ctrl+D)"
          >
            📊
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-tags"));
            }}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110 hover-glow"
            title="Tags (#tag)"
          >
            🏷️
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-settings"));
            }}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110 hover-glow"
            title="Configurações (Ctrl+,)"
          >
            ⚙️
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110"
            title={isEditing ? "Visualizar" : "Editar"}
          >
            {isEditing ? "👁️" : "✏️"}
          </button>
          <button
            onClick={handleSave}
              className="px-4 py-2 gradient-primary text-white text-sm font-semibold rounded-xl transition-all hover:scale-110 shadow-lg hover:shadow-xl"
            title="Salvar (Ctrl+S)"
          >
            💾 Salvar
          </button>
        </div>
        {!isMobile && (
          <button
            onClick={onToggleSidebar}
            className="px-3 py-2 glass hover:bg-white/10 text-white text-sm rounded-xl transition-all hover:scale-110"
            title="Informações (Ctrl+B)"
          >
            ℹ️
          </button>
        )}
      </div>

      {/* Editor/Visualizador */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <div className="h-full relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full p-6 bg-transparent text-foreground resize-none outline-none font-mono text-sm md:text-base leading-relaxed"
              placeholder="✨ Comece a escrever...&#10;&#10;💡 Dica: Use [[Nome da Nota]] para criar links bidirecionais&#10;📝 Exemplo: Esta nota fala sobre [[Desenvolvimento Web]]"
              spellCheck={false}
              style={{
                background: "linear-gradient(transparent, transparent)",
                color: "#e4e4e7",
                caretColor: "#6366f1",
              }}
            />
          </div>
        ) : (
          <div className="p-6 prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-headings:gradient-text">
            {renderMarkdownContent()}
          </div>
        )}
      </div>
    </div>
  );
}

