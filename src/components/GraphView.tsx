import { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { VaultContext } from "../contexts/VaultContext";
import { GraphBuilder, type GraphData } from "../utils/graph";
import { Storage } from "../utils/storage";

interface GraphViewProps {
  isVisible: boolean;
  onClose: () => void;
  onNodeClick?: (nodeId: string) => void;
}

export default function GraphView({ isVisible, onClose, onNodeClick }: GraphViewProps) {
  const { notes, setCurrentNote } = useContext(VaultContext);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isVisible || !notes.length) return;

    const loadGraph = async () => {
      setIsLoading(true);
      
      // Carrega todo o conteúdo das notas para o grafo
      const loadAllNotesContent = async () => {
        const notesWithContent: typeof notes = [];

        const processNotes = async (items: typeof notes) => {
          for (const item of items) {
            if (item.isDirectory && item.children) {
              const children = await processNotes(item.children);
              notesWithContent.push({
                ...item,
                children,
              });
            } else if (!item.isDirectory) {
              try {
                const loadedNote = await Storage.getNote(item.id);
                if (loadedNote) {
                  notesWithContent.push(loadedNote);
                } else {
                  notesWithContent.push(item);
                }
              } catch {
                notesWithContent.push(item);
              }
            }
          }
          return notesWithContent;
        };

        const allNotes = await processNotes(notes);
        return allNotes;
      };

      const allNotes = await loadAllNotesContent();
      const graph = GraphBuilder.buildGraph(allNotes);
      setGraphData(graph);
      setIsLoading(false);
    };

    loadGraph();
  }, [notes, isVisible]);

  useEffect(() => {
    if (!graphData || !containerRef.current || !isVisible || isLoading) return;

    const canvas = document.createElement("canvas");
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    
    if (canvasRef.current) {
      containerRef.current.removeChild(canvasRef.current);
    }
    
    containerRef.current.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simulação de física simples (force-directed graph)
    const nodes = graphData.nodes.map(node => ({
      ...node,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
    }));

    const links = graphData.links;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Aplica forças
      for (const link of links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - 100) * 0.01;

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }

      // Aplica repulsão entre nós
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = -50 / (distance * distance);

          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodes[i].vx += fx;
          nodes[i].vy += fy;
          nodes[j].vx -= fx;
          nodes[j].vy -= fy;
        }
      }

      // Atualiza posições
      for (const node of nodes) {
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Limites da tela
        node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
        node.y = Math.max(20, Math.min(canvas.height - 20, node.y));
      }

      // Desenha links
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      for (const link of links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }

      // Desenha nós
      for (const node of nodes) {
        ctx.fillStyle = selectedNode === node.id ? "#3b82f6" : node.group === 0 ? "#10b981" : "#6366f1";
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.size + 15);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const node of nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < node.size + 10) {
          setSelectedNode(node.id);
          if (onNodeClick) {
            onNodeClick(node.id);
          }
          break;
        }
      }
    };

    canvas.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("click", handleClick);
    };
  }, [graphData, selectedNode, isVisible, isLoading, onNodeClick]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Graph View - Conexões entre Notas</h2>
        <div className="flex gap-2 items-center">
          {graphData && (
            <div className="text-sm text-gray-400">
              {graphData.nodes.length} notas • {graphData.links.length} conexões
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Fechar (Esc)
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">Carregando grafo...</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm text-gray-400">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Notas principais</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
            <span>Subnotas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Selecionada</span>
          </div>
        </div>
        <p className="mt-2 text-xs">Clique em um nó para abrir a nota correspondente</p>
      </div>
    </div>
  );
}
