import { useCallback, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pagesApi } from "../api/pages";
import { MarkdownRenderer, type Heading } from "../components/MarkdownRenderer";
import { Sidecard } from "../components/Sidecard";
import { LinkedPageRef } from "../components/LinkedPageRef";
import { TableOfContents } from "../components/TableOfContents";
import { readingTime } from "../lib/readingTime";
import { useAuth } from "../auth/AuthContext";
import styles from "./ArticleView.module.css";

export function ArticleView() {
  const { id } = useParams();
  const pageId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["pages", pageId],
    queryFn: () => pagesApi.get(pageId),
    enabled: Number.isFinite(pageId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => pagesApi.remove(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      navigate("/");
    },
  });

  const [removingLinkId, setRemovingLinkId] = useState<number | null>(null);
  const unlinkMutation = useMutation({
    mutationFn: (destinyId: number) => pagesApi.unlink(pageId, destinyId),
    onMutate: (destinyId) => setRemovingLinkId(destinyId),
    onSettled: () => setRemovingLinkId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pages", pageId] }),
  });

  const [headings, setHeadings] = useState<Heading[]>([]);
  const handleHeadingsChange = useCallback((next: Heading[]) => setHeadings(next), []);

  if (isLoading) return <p className={styles.state}>Carregando…</p>;
  if (isError || !page) return <p className={styles.state}>Artigo não encontrado.</p>;

  const primaryCategory = page.categories[0];

  return (
    <div className={headings.length > 0 ? styles.gridWithToc : styles.grid}>
      {headings.length > 0 && <TableOfContents headings={headings} />}
      <article className={styles.article}>
        <header className={styles.header}>
          {primaryCategory && (
            <Link to={`/busca?category_id=${primaryCategory.id}`} className={styles.eyebrow}>
              {primaryCategory.category_name}
            </Link>
          )}

          <h1 className={styles.title}>{page.title}</h1>

          <div className={styles.metaRow}>
            <span className={styles.meta}>{readingTime(page.content)} min de leitura</span>
            {isAuthenticated && (
              <>
                <span className={styles.metaDivider} aria-hidden="true">
                  ·
                </span>
                <Link to={`/artigo/${page.id}/editar`} className={styles.metaLink}>
                  editar
                </Link>
                {confirmingDelete ? (
                  <span className={styles.confirmDelete}>
                    excluir mesmo?
                    <button
                      className={styles.confirmYes}
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "excluindo…" : "sim"}
                    </button>
                    <button className={styles.metaLink} onClick={() => setConfirmingDelete(false)}>
                      não
                    </button>
                  </span>
                ) : (
                  <button className={styles.metaLink} onClick={() => setConfirmingDelete(true)}>
                    excluir
                  </button>
                )}
              </>
            )}
          </div>

          {page.tags.length > 0 && (
            <div className={styles.badges}>
              {page.tags.map((t) => (
                <Link key={t.id} to={`/busca?tag_id=${t.id}`} className={styles.tagBadge}>
                  {t.tag_name}
                </Link>
              ))}
            </div>
          )}
        </header>

        <MarkdownRenderer content={page.content} onHeadingsChange={handleHeadingsChange} />

        {page.outgoing_page_ids.length > 0 && (
          <section className={styles.linksSection}>
            <h2 className={styles.linksSectionTitle}>Artigos referenciados</h2>
            <ul>
              {page.outgoing_page_ids.map((id) => (
                <LinkedPageRef
                  key={id}
                  pageId={id}
                  onRemove={isAuthenticated ? () => unlinkMutation.mutate(id) : undefined}
                  removing={removingLinkId === id}
                />
              ))}
            </ul>
          </section>
        )}

        {page.incoming_page_ids.length > 0 && (
          <section className={styles.linksSection}>
            <h2 className={styles.linksSectionTitle}>Referenciado por</h2>
            <ul>
              {page.incoming_page_ids.map((id) => (
                <LinkedPageRef key={id} pageId={id} />
              ))}
            </ul>
          </section>
        )}
      </article>

      <Sidecard data={page.sidecard} title={page.title} />
    </div>
  );
}
