import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { categoriesApi } from "../api/categories";
import type { CategoryTree } from "../types/api";
import styles from "./CategoryTreeList.module.css";

function CategoryNode({ node }: { node: CategoryTree }) {
  return (
    <li>
      <NavLink
        to={`/busca?category_id=${node.id}`}
        className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
      >
        {node.category_name}
      </NavLink>
      {node.children.length > 0 && (
        <ul className={styles.subList}>
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTreeList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: categoriesApi.tree,
  });

  if (isLoading) return <p className={styles.muted}>Carregando…</p>;
  if (isError) return <p className={styles.muted}>Não foi possível carregar categorias.</p>;
  if (!data || data.length === 0) return <p className={styles.muted}>Nenhuma categoria ainda.</p>;

  return (
    <ul className={styles.rootList}>
      {data.map((node) => (
        <CategoryNode key={node.id} node={node} />
      ))}
    </ul>
  );
}
