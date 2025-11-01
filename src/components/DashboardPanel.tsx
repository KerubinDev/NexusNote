import { useContext, useEffect, useState } from "react";
import { VaultContext } from "../contexts/VaultContext";
import { Storage } from "../utils/storage";
import { MarkdownParser } from "../utils/markdown";
import { GraphBuilder } from "../utils/graph";
import type { NoteFile } from "../types";

interface DashboardPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (noteId: string) => void;
}

export default function DashboardPanel({ isVisible, onClose, onNavigate }: DashboardPanelProps) {
  const { notes } = useContext(VaultContext);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalFolders: 0,
    totalLinks: 0,
    recentNotes: [] as NoteFile[],
    mostLinked: [] as Array<{ note: NoteFile; links: number }>,
  });

  useEffect(() => {
    if (!isVisible || !notes.length) return;

    const calculateStats = async () => {
      let totalNotes = 0;
      let totalFolders = 0;
      const allNotes: NoteFile[] = [];
      const linkCounts = new Map<string, number>();

      const processNotes = async (items: typeof notes) => {
        for (const item of items) {
          if (item.isDirectory) {
            totalFolders++;
            if (item.children) {
              await processNotes(item.children);
            }
          } else {
            totalNotes++;
            try {
              const loadedNote = await Storage.getNote(item.id);
              if (loadedNote) {
                allNotes.push(loadedNote);
                const links = MarkdownParser.extractWikiLinks(loadedNote.content);
                linkCounts.set(loadedNote.id, links.length);
              }
            } catch {
              allNotes.push(item);
            }
          }
        }
      };

      await processNotes(notes);

      // Calcula total de links
      const graph = GraphBuilder.buildGraph(allNotes);
      const totalLinks = graph.links.length;

      // Notas mais recentes (últimas 5)
      const recent = allNotes
        .sort((a, b) => {
          // Ordena por ID (que contém timestamp)
          return b.id.localeCompare(a.id);
        })
        .slice(0, 5);

      // Notas mais linkadas (top 5)
      const mostLinked = Array.from(linkCounts.entries())
        .map(([id, links]) => {
          const note = allNotes.find((n) => n.id === id);
          return note ? { note, links } : null;
        })
        .filter((item): item is { note: NoteFile; links: number } => item !== null)
        .sort((a, b) => b.links - a.links)
        .slice(0, 5);

      setStats({
        totalNotes,
        totalFolders,
        totalLinks,
        recentNotes: recent,
        mostLinked,
      });
    };

    calculateStats();
  }, [notes, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 glass-strong">
        <h1 className="text-4xl font-bold gradient-text">📊 Dashboard</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 glass hover:bg-white/10 text-white rounded-xl transition-all hover:scale-110 font-semibold"
        >
          ✕ Fechar
        </button>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="gradient-blue rounded-2xl p-6 shadow-2xl hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-white/80 text-sm mb-2 font-medium">Total de Notas</div>
            <div className="text-5xl font-black text-white">{stats.totalNotes}</div>
          </div>
          <div className="gradient-purple rounded-2xl p-6 shadow-2xl hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-white/80 text-sm mb-2 font-medium">Total de Pastas</div>
            <div className="text-5xl font-black text-white">{stats.totalFolders}</div>
          </div>
          <div className="gradient-green rounded-2xl p-6 shadow-2xl hover-lift animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-white/80 text-sm mb-2 font-medium">Total de Conexões</div>
            <div className="text-5xl font-black text-white">{stats.totalLinks}</div>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="card-premium mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-2xl font-bold gradient-text mb-6">📝 Notas Recentes</h2>
          {stats.recentNotes.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma nota ainda</p>
          ) : (
            <div className="space-y-3">
              {stats.recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onNavigate(note.id)}
                  className="p-4 glass hover:bg-white/5 rounded-xl cursor-pointer transition-all hover:scale-105 hover-lift"
                >
                  <div className="font-semibold text-white mb-1">{note.name}</div>
                  <div className="text-sm text-gray-400 truncate">{note.content.substring(0, 100)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Linked */}
        <div className="card-premium animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h2 className="text-2xl font-bold gradient-text mb-6">🔗 Notas Mais Linkadas</h2>
          {stats.mostLinked.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nenhuma conexão ainda</p>
          ) : (
            <div className="space-y-3">
              {stats.mostLinked.map((item) => (
                <div
                  key={item.note.id}
                  onClick={() => onNavigate(item.note.id)}
                  className="p-4 glass hover:bg-white/5 rounded-xl cursor-pointer transition-all hover:scale-105 hover-lift flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{item.note.name}</div>
                  </div>
                  <div className="gradient-blue text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {item.links} links
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

