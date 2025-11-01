import type { Heading, Backlink } from "../types";

export class MarkdownParser {
  /**
   * Extrai todos os links bidirecionais [[Nota]] de um texto
   */
  static extractWikiLinks(content: string): string[] {
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const linkText = match[1].split("|")[0].trim(); // Suporta [[Nota|Alias]]
      if (linkText && !links.includes(linkText)) {
        links.push(linkText);
      }
    }

    return links;
  }

  /**
   * Encontra todos os cabeçalhos (H1, H2, H3) em um texto Markdown
   */
  static extractHeadings(content: string): Heading[] {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const headings: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      headings.push({
        level,
        text,
        id,
      });
    }

    return headings;
  }

  /**
   * Encontra backlinks - notas que referenciam uma nota específica
   */
  static findBacklinks(
    targetNoteName: string,
    allNotes: Array<{ path: string; content: string }>
  ): Backlink[] {
    const backlinks: Backlink[] = [];
    const targetNameLower = targetNoteName.toLowerCase();

    for (const note of allNotes) {
      const links = this.extractWikiLinks(note.content);
      
      for (const link of links) {
        if (link.toLowerCase() === targetNameLower) {
          // Extrai contexto (linha onde o link aparece)
          const lines = note.content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`[[${link}]]`)) {
              const context = lines[i].trim().substring(0, 80);
              backlinks.push({
                from: note.path,
                to: targetNoteName,
                context: context || "Sem contexto",
              });
              break;
            }
          }
        }
      }
    }

    return backlinks;
  }

  /**
   * Converte nome de nota para ID/path
   */
  static noteNameToId(noteName: string, storageType: "indexeddb" | "filesystem"): string {
    const cleanName = noteName
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    
    if (storageType === "filesystem") {
      return `file-nexusnote/${cleanName}.md`;
    }
    return `file-${cleanName}.md`;
  }

  static noteNameToPath(noteName: string, storageType: "indexeddb" | "filesystem"): string {
    const cleanName = noteName
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    
    if (storageType === "filesystem") {
      return `nexusnote/${cleanName}.md`;
    }
    return `${cleanName}.md`;
  }

  static noteNameToId(noteName: string): string {
    return `file-${noteName.replace(/[<>:"/\\|?*]/g, "").trim()}`;
  }
}

