import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { pagesApi } from "../api/pages";
import { ArticleListItem } from "../components/ArticleListItem";
import { SearchBox } from "../components/SearchBox";
import { useTypewriter } from "../hooks/useTypewriter";
import styles from "./Home.module.css";

const TITLE = "With Bare Brains";

export function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pages", "home"],
    queryFn: () => pagesApi.list({ limit: 50 }),
  });

  const { display } = useTypewriter(TITLE);
  const articles = data ? [...data].sort((a, b) => b.id - a.id) : undefined;

  return (
    <div className={styles.wrap}>
      <header className={styles.masthead}>
        <h1 className={styles.title} aria-label={TITLE}>
          <span aria-hidden="true">
            {display}
            <span className={styles.cursor}>|</span>
          </span>
        </h1>
        <div className={styles.searchWrap}>
          <SearchBox />
        </div>
      </header>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Artigos</h2>
        {articles && articles.length > 0 && (
          <span className={styles.count}>{articles.length}</span>
        )}
      </div>

      {isLoading && <p className={styles.state}>Carregando…</p>}
      {isError && <p className={styles.state}>Não foi possível carregar os artigos.</p>}
      {articles && articles.length === 0 && (
        <p className={styles.empty}>
          Nenhum artigo ainda. <Link to="/novo">Escreva o primeiro</Link>.
        </p>
      )}
      {articles && articles.length > 0 && (
        <ul className={styles.list}>
          {articles.map((page) => (
            <ArticleListItem key={page.id} page={page} />
          ))}
        </ul>
      )}
    </div>
  );
}
