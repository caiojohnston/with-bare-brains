import type { Heading } from "./MarkdownRenderer";
import styles from "./TableOfContents.module.css";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;

  return (
    <nav className={styles.toc} aria-label="Tópicos do artigo">
      <h2 className={styles.title}>Nesta página</h2>
      <ul className={styles.list}>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? styles.sub : undefined}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
