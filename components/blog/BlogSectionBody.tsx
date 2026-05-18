import type { BlogContentBlock } from "@/lib/blog/types";
import { BlogRichText } from "@/components/blog/BlogRichText";

export function BlogSectionBody({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.type === "p") {
          return (
            <p key={i} className="text-pretty text-base leading-relaxed text-slate-700">
              <BlogRichText text={block.text} />
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700">
              {block.items.map((item) => (
                <li key={item}>
                  <BlogRichText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={i} className="list-decimal space-y-2 pl-5 text-base leading-relaxed text-slate-700">
            {block.items.map((item) => (
              <li key={item}>
                <BlogRichText text={item} />
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}
