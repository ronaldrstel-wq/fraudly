import Link from "next/link";
import type { ReactNode } from "react";

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Renders paragraphs with optional markdown-style internal links: [label](/path) */
export function BlogRichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const label = match[1];
    const href = match[2];
    const external = href.startsWith("http");
    nodes.push(
      external ? (
        <a
          key={key++}
          href={href}
          className="font-medium text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      ) : (
        <Link
          key={key++}
          href={href}
          className="font-medium text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800"
        >
          {label}
        </Link>
      )
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return <>{nodes.length > 0 ? nodes : text}</>;
}
