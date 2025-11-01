import type { NoteFile } from "../types";
import { MarkdownParser } from "./markdown";

export interface GraphNode {
  id: string;
  name: string;
  group: number;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export class GraphBuilder {
  /**
   * Constrói o grafo de conexões entre todas as notas
   */
  static buildGraph(notes: NoteFile[]): GraphData {
    const nodes: Map<string, GraphNode> = new Map();
    const links: GraphLink[] = [];
    const nodeGroups: Map<string, number> = new Map();

    // Primeiro, cria todos os nós (notas)
    const processNotes = (items: NoteFile[], depth: number = 0) => {
      for (const note of items) {
        if (!note.isDirectory) {
          const noteId = note.id;
          const noteName = note.name.replace(".md", "");
          
          if (!nodes.has(noteId)) {
            nodes.set(noteId, {
              id: noteId,
              name: noteName,
              group: depth,
              size: 8,
            });
          }

          // Processa subdiretórios
          if (note.children) {
            processNotes(note.children, depth + 1);
          }
        } else if (note.children) {
          processNotes(note.children, depth);
        }
      }
    };

    processNotes(notes);

    // Depois, cria os links (conexões)
    const findLinks = (items: NoteFile[]) => {
      for (const note of items) {
        if (!note.isDirectory) {
          const wikiLinks = MarkdownParser.extractWikiLinks(note.content);
          const sourceId = note.id;

          for (const linkName of wikiLinks) {
            // Procura a nota alvo
            const findTargetNote = (items: NoteFile[]): NoteFile | null => {
              for (const item of items) {
                if (!item.isDirectory) {
                  const nameWithoutExt = item.name.replace(".md", "");
                  if (nameWithoutExt.toLowerCase() === linkName.toLowerCase()) {
                    return item;
                  }
                }
                if (item.children) {
                  const found = findTargetNote(item.children);
                  if (found) return found;
                }
              }
              return null;
            };

            const targetNote = findTargetNote(notes);

            if (targetNote && targetNote.id !== sourceId) {
              // Evita duplicatas
              const linkExists = links.some(
                (l) => l.source === sourceId && l.target === targetNote.id
              );

              if (!linkExists) {
                links.push({
                  source: sourceId,
                  target: targetNote.id,
                  value: 1,
                });

                // Aumenta o tamanho do nó baseado no número de conexões
                const targetNode = nodes.get(targetNote.id);
                if (targetNode) {
                  targetNode.size = Math.min(targetNode.size + 2, 20);
                }

                const sourceNode = nodes.get(sourceId);
                if (sourceNode) {
                  sourceNode.size = Math.min(sourceNode.size + 2, 20);
                }
              }
            }
          }
        }

        if (note.children) {
          findLinks(note.children);
        }
      }
    };

    findLinks(notes);

    return {
      nodes: Array.from(nodes.values()),
      links,
    };
  }

  /**
   * Calcula a centralidade de cada nó (quantas conexões ele tem)
   */
  static calculateCentrality(graph: GraphData): Map<string, number> {
    const centrality = new Map<string, number>();

    for (const node of graph.nodes) {
      centrality.set(node.id, 0);
    }

    for (const link of graph.links) {
      const sourceCentrality = centrality.get(link.source) || 0;
      const targetCentrality = centrality.get(link.target) || 0;
      centrality.set(link.source, sourceCentrality + 1);
      centrality.set(link.target, targetCentrality + 1);
    }

    return centrality;
  }
}

