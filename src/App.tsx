import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import ExplorerPanel from "./components/ExplorerPanel";
import EditorPanel from "./components/EditorPanel";
import SidebarPanel from "./components/SidebarPanel";
import GraphView from "./components/GraphView";
import SearchPanel from "./components/SearchPanel";
import DashboardPanel from "./components/DashboardPanel";
import SettingsPanel from "./components/SettingsPanel";
import TagsPanel from "./components/TagsPanel";
import { VaultContext } from "./contexts/VaultContext";
import { Storage } from "./utils/storage";
import type { NoteFile } from "./types";

function App() {
  const [vaultName] = useState<string>("Meu Vault");
  const [currentNote, setCurrentNote] = useState<NoteFile | null>(null);
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    // Configura status bar no mobile
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: "#1e1e1e" });
    }

    // Inicializa storage e carrega notas
    const loadNotes = async () => {
      await Storage.init();
      const loadedNotes = await Storage.getAllNotes();
      setNotes(loadedNotes);
    };

    loadNotes();
  }, []);

  const refreshVault = async () => {
    const loadedNotes = await Storage.getAllNotes();
    setNotes(loadedNotes);
  };

  // No mobile, esconde painéis quando abre uma nota
  useEffect(() => {
    if (isMobile && currentNote) {
      setShowExplorer(false);
      setShowSidebar(false);
    }
  }, [currentNote, isMobile]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para busca
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      // Ctrl/Cmd + G para Graph View
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setShowGraph(!showGraph);
      }
      // Escape para fechar modais
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        if (showGraph) setShowGraph(false);
        if (showDashboard) setShowDashboard(false);
        if (showSettings) setShowSettings(false);
        if (showTags) setShowTags(false);
      }
      // Ctrl/Cmd + D para Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setShowDashboard(!showDashboard);
      }
      // Ctrl/Cmd + , para Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setShowSettings(!showSettings);
      }
      // Ctrl/Cmd + B para toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setShowSidebar(!showSidebar);
      }
      // Ctrl/Cmd + S para salvar
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // Dispara evento para o EditorPanel salvar
        window.dispatchEvent(new CustomEvent("save-note"));
      }
    };

    // Eventos customizados dos botões
    const handleOpenSearch = () => setShowSearch(true);
    const handleOpenGraph = () => setShowGraph(!showGraph);
    const handleOpenDashboard = () => setShowDashboard(!showDashboard);
    const handleOpenSettings = () => setShowSettings(!showSettings);
    const handleOpenTags = () => setShowTags(!showTags);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search" as any, handleOpenSearch);
    window.addEventListener("open-graph" as any, handleOpenGraph);
    window.addEventListener("open-dashboard" as any, handleOpenDashboard);
    window.addEventListener("open-settings" as any, handleOpenSettings);
    window.addEventListener("open-tags" as any, handleOpenTags);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search" as any, handleOpenSearch);
      window.removeEventListener("open-graph" as any, handleOpenGraph);
      window.removeEventListener("open-dashboard" as any, handleOpenDashboard);
      window.removeEventListener("open-settings" as any, handleOpenSettings);
      window.removeEventListener("open-tags" as any, handleOpenTags);
    };
  }, [showSearch, showGraph, showSidebar, showDashboard, showSettings, showTags]);

  const storageType = Storage.getStorageType();

  const handleGraphNodeClick = async (nodeId: string) => {
    const findNoteById = (items: typeof notes): NoteFile | null => {
      for (const item of items) {
        if (item.id === nodeId) return item;
        if (item.children) {
          const found = findNoteById(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const note = findNoteById(notes);
    if (note && !note.isDirectory) {
      const loadedNote = await Storage.getNote(note.id);
      setCurrentNote(loadedNote || note);
      setShowGraph(false);
    }
  };

  return (
    <VaultContext.Provider
      value={{
        vaultName,
        currentNote,
        setCurrentNote,
        notes,
        setNotes,
        refreshVault,
        storageType,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Painel Esquerdo - Explorador */}
        {(showExplorer || !isMobile) && (
          <ExplorerPanel
            isVisible={showExplorer || !isMobile}
            onClose={() => setShowExplorer(false)}
          />
        )}

        {/* Painel Central - Editor */}
        <EditorPanel
          onToggleExplorer={() => setShowExplorer(!showExplorer)}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />

        {/* Painel Direito - Sidebar */}
        {(showSidebar || (!isMobile && currentNote)) && (
          <SidebarPanel
            isVisible={showSidebar || (!isMobile && currentNote !== null)}
            onClose={() => setShowSidebar(false)}
          />
        )}

        {/* Graph View */}
        <GraphView
          isVisible={showGraph}
          onClose={() => setShowGraph(false)}
          onNodeClick={handleGraphNodeClick}
        />

        {/* Search Panel */}
        <SearchPanel
          isVisible={showSearch}
          onClose={() => setShowSearch(false)}
        />

        {/* Dashboard Panel */}
        <DashboardPanel
          isVisible={showDashboard}
          onClose={() => setShowDashboard(false)}
          onNavigate={async (noteId: string) => {
            const findNoteById = (items: typeof notes): NoteFile | null => {
              for (const item of items) {
                if (item.id === noteId) return item;
                if (item.children) {
                  const found = findNoteById(item.children);
                  if (found) return found;
                }
              }
              return null;
            };
            const note = findNoteById(notes);
            if (note) {
              const loadedNote = await Storage.getNote(note.id);
              setCurrentNote(loadedNote || note);
              setShowDashboard(false);
            }
          }}
        />

        {/* Settings Panel */}
        <SettingsPanel
          isVisible={showSettings}
          onClose={() => setShowSettings(false)}
        />

        {/* Tags Panel */}
        <TagsPanel
          isVisible={showTags}
          onClose={() => setShowTags(false)}
          onNavigate={async (noteId: string) => {
            const findNoteById = (items: typeof notes): NoteFile | null => {
              for (const item of items) {
                if (item.id === noteId) return item;
                if (item.children) {
                  const found = findNoteById(item.children);
                  if (found) return found;
                }
              }
              return null;
            };
            const note = findNoteById(notes);
            if (note) {
              const loadedNote = await Storage.getNote(note.id);
              setCurrentNote(loadedNote || note);
              setShowTags(false);
            }
          }}
        />
      </div>
    </VaultContext.Provider>
  );
}

export default App;

