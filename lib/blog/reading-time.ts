export function estimateReadingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 200));
}

export function articleWordCount(article: {
  intro: string;
  sections: { blocks: { type: string; text?: string; items?: string[] }[] }[];
}): number {
  let count = article.intro.trim().split(/\s+/).filter(Boolean).length;
  for (const section of article.sections) {
    for (const block of section.blocks) {
      if (block.type === "p" && block.text) {
        count += block.text.trim().split(/\s+/).filter(Boolean).length;
      }
      if ((block.type === "ul" || block.type === "ol") && block.items) {
        for (const item of block.items) {
          count += item.trim().split(/\s+/).filter(Boolean).length;
        }
      }
    }
  }
  return count;
}

export function articlePlainText(article: {
  intro: string;
  sections: { blocks: { type: string; text?: string; items?: string[] }[] }[];
}): string {
  const parts = [article.intro];
  for (const section of article.sections) {
    for (const block of section.blocks) {
      if (block.type === "p" && block.text) parts.push(block.text);
      if ((block.type === "ul" || block.type === "ol") && block.items) parts.push(...block.items);
    }
  }
  return parts.join(" ");
}
