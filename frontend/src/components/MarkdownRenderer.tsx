import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { Link } from "react-router-dom";
import styles from "./MarkdownRenderer.module.css";

const INTERNAL_LINK = /^\/artigo\/(\d+)$/;

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface MarkdownRendererProps {
  content: string;
  onHeadingsChange?: (headings: Heading[]) => void;
}

export function MarkdownRenderer({ content, onHeadingsChange }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onHeadingsChange) return;
    const el = containerRef.current;
    if (!el) return;
    const headings = Array.from(el.querySelectorAll("h2, h3")).map((node) => ({
      id: node.id,
      text: node.textContent ?? "",
      level: node.tagName === "H2" ? 2 : 3,
    }));
    onHeadingsChange(headings);
  }, [content, onHeadingsChange]);

  return (
    <div className={styles.prose} ref={containerRef}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          a({ href, children, ...props }) {
            const internal = href ? INTERNAL_LINK.test(href) : false;
            if (internal && href) {
              return <Link to={href}>{children}</Link>;
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
