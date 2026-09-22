import { Link } from "react-router-dom";
import type { PageSummary } from "../types/api";
import styles from "./ArticleListItem.module.css";

export function ArticleListItem({ page }: { page: PageSummary }) {
  return (
    <li className={styles.item}>
      <Link to={`/artigo/${page.id}`} className={styles.link}>
        {page.title}
      </Link>
      <Link
        to={`/artigo/${page.id}/editar`}
        className={styles.editLink}
        aria-label={`Editar ${page.title}`}
        title="Editar"
      >
        editar
      </Link>
    </li>
  );
}
