import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { pagesApi } from "../api/pages";
import { categoriesApi } from "../api/categories";
import { tagsApi } from "../api/tags";
import { ArticleListItem } from "../components/ArticleListItem";
import { CategoryTreeList } from "../components/CategoryTreeList";
import styles from "./Search.module.css";

export function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const categoryId = params.get("category_id");
  const tagId = params.get("tag_id");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });
  const { data: tags } = useQuery({ queryKey: ["tags"], queryFn: tagsApi.list });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pages", "search", q, categoryId, tagId],
    queryFn: () =>
      pagesApi.list({
        q: q || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        tag_id: tagId ? Number(tagId) : undefined,
        limit: 100,
      }),
  });

  const activeCategory = categories?.find((c) => String(c.id) === categoryId);
  const activeTag = tags?.find((t) => String(t.id) === tagId);

  function clearFilter(key: "category_id" | "tag_id") {
    const next = new URLSearchParams(params);
    next.delete(key);
    setParams(next);
  }

  function handleTagChange(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("tag_id", value);
    else next.delete("tag_id");
    setParams(next);
  }

  return (
    <div className={styles.grid}>
      <nav className={styles.sidebar} aria-label="Categorias">
        <h2 className={styles.sidebarTitle}>Categorias</h2>
        <CategoryTreeList />
      </nav>

      <div className={styles.wrap}>
        <h1 className={styles.title}>{q ? `Resultados para "${q}"` : "Todos os artigos"}</h1>

        <div className={styles.filters}>
          {activeCategory && (
            <button className={styles.chip} onClick={() => clearFilter("category_id")}>
              Categoria: {activeCategory.category_name} ×
            </button>
          )}
          {activeTag && (
            <button className={styles.chip} onClick={() => clearFilter("tag_id")}>
              Tag: {activeTag.tag_name} ×
            </button>
          )}
          <select
            className={styles.tagSelect}
            value={tagId ?? ""}
            onChange={(e) => handleTagChange(e.target.value)}
          >
            <option value="">Filtrar por tag…</option>
            {tags?.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.tag_name}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p>Buscando…</p>}
        {isError && <p>Não foi possível buscar artigos.</p>}
        {data && (
          <>
            <p className={styles.count}>
              {data.length} {data.length === 1 ? "artigo encontrado" : "artigos encontrados"}
            </p>
            <ul className={styles.list}>
              {data.map((page) => (
                <ArticleListItem key={page.id} page={page} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
