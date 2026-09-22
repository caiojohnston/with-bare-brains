import { useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pagesApi } from "../api/pages";
import { ApiRequestError } from "../api/client";
import { categoriesApi } from "../api/categories";
import { tagsApi } from "../api/tags";
import { imagesApi } from "../api/images";
import { useDebounce } from "../hooks/useDebounce";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import type { PageRead } from "../types/api";
import styles from "./ArticleEditor.module.css";

interface SidecardRow {
  key: string;
  value: string;
}

interface DraftState {
  title: string;
  content: string;
  slug: string;
  categoryIds: number[];
  tagIds: number[];
  sidecard: SidecardRow[];
}

const EMPTY_DRAFT: DraftState = {
  title: "",
  content: "",
  slug: "",
  categoryIds: [],
  tagIds: [],
  sidecard: [],
};

function draftKey(pageId: number | null) {
  return `bare-brains-draft:${pageId ?? "new"}`;
}

function sidecardToRows(sidecard: PageRead["sidecard"]): SidecardRow[] {
  if (!sidecard) return [];
  return Object.entries(sidecard).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

function rowsToSidecard(rows: SidecardRow[]): Record<string, string> | null {
  const entries = rows.filter((r) => r.key.trim());
  if (entries.length === 0) return null;
  return Object.fromEntries(entries.map((r) => [r.key.trim(), r.value]));
}

function insertAtCursor(
  ref: RefObject<HTMLTextAreaElement | null>,
  text: string,
  current: string,
  onChange: (next: string) => void,
) {
  const el = ref.current;
  if (!el) {
    onChange(current + text);
    return;
  }
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const next = current.slice(0, start) + text + current.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.selectionStart = el.selectionEnd = start + text.length;
  });
}

// Envolve o trecho selecionado com a marcação markdown (ex.: **negrito**), sem o
// usuário ter que digitar os marcadores na mão. Se nada estiver selecionado, insere
// os marcadores vazios com o cursor entre eles.
function wrapSelection(
  ref: RefObject<HTMLTextAreaElement | null>,
  marker: string,
  current: string,
  onChange: (next: string) => void,
) {
  const el = ref.current;
  const start = el?.selectionStart ?? current.length;
  const end = el?.selectionEnd ?? current.length;
  const selected = current.slice(start, end);
  const next = current.slice(0, start) + marker + selected + marker + current.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el?.focus();
    if (!el) return;
    el.selectionStart = start + marker.length;
    el.selectionEnd = start + marker.length + selected.length;
  });
}

// Aplica (ou remove, se já estiver aplicado) um nível de heading na linha onde está o
// cursor — é o jeito markdown de mudar o "tamanho" de um trecho: título grande (##),
// médio (###) ou pequeno (####). Heading é sempre a linha inteira, não um trecho
// inline no meio de uma frase.
function toggleHeadingLine(
  ref: RefObject<HTMLTextAreaElement | null>,
  level: number,
  current: string,
  onChange: (next: string) => void,
) {
  const el = ref.current;
  const pos = el?.selectionStart ?? current.length;
  const lineStart = current.lastIndexOf("\n", pos - 1) + 1;
  const lineEndIdx = current.indexOf("\n", pos);
  const lineEnd = lineEndIdx === -1 ? current.length : lineEndIdx;
  const line = current.slice(lineStart, lineEnd);

  const prefix = "#".repeat(level) + " ";
  const stripped = line.replace(/^#{1,6}\s+/, "");
  const nextLine = line.startsWith(prefix) ? stripped : prefix + stripped;

  const next = current.slice(0, lineStart) + nextLine + current.slice(lineEnd);
  onChange(next);
  requestAnimationFrame(() => {
    el?.focus();
    if (!el) return;
    const newPos = lineStart + nextLine.length;
    el.selectionStart = el.selectionEnd = newPos;
  });
}

export function ArticleEditor() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [pageId, setPageId] = useState<number | null>(editingId);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [draftBanner, setDraftBanner] = useState<DraftState | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [linkQuery, setLinkQuery] = useState("");
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: ["pages", editingId],
    queryFn: () => pagesApi.get(editingId as number),
    enabled: editingId !== null,
  });

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: tagsApi.list });

  const debouncedLinkQuery = useDebounce(linkQuery, 300);
  const linkResults = useQuery({
    queryKey: ["pages", "link-search", debouncedLinkQuery],
    queryFn: () => pagesApi.list({ q: debouncedLinkQuery, limit: 8 }),
    enabled: showLinkPanel && debouncedLinkQuery.trim().length > 1,
  });

  // Popula o formulário com os dados do servidor UMA VEZ por artigo — nunca de novo a
  // partir daí, para que um refetch em segundo plano (ex.: após upload de imagem) não
  // sobrescreva o que o usuário está digitando.
  const initializedForRef = useRef<number | null | "pending">("pending");
  useEffect(() => {
    if (editingId !== null && !existing.data) return;
    if (initializedForRef.current === editingId) return;
    initializedForRef.current = editingId;

    const fromServer: DraftState = existing.data
      ? {
          title: existing.data.title,
          content: existing.data.content,
          slug: existing.data.slug,
          categoryIds: existing.data.categories.map((c) => c.id),
          tagIds: existing.data.tags.map((t) => t.id),
          sidecard: sidecardToRows(existing.data.sidecard),
        }
      : EMPTY_DRAFT;

    let stored: DraftState | null = null;
    try {
      const raw = localStorage.getItem(draftKey(editingId));
      if (raw) stored = JSON.parse(raw) as DraftState;
    } catch {
      stored = null;
    }

    if (stored && JSON.stringify(stored) !== JSON.stringify(fromServer)) {
      setDraftBanner(stored);
    }
    setDraft(fromServer);
  }, [editingId, existing.data]);

  // Autosave local (debounced) a cada mudança de conteúdo.
  const debouncedDraft = useDebounce(draft, 800);
  useEffect(() => {
    if (debouncedDraft === EMPTY_DRAFT) return;
    try {
      localStorage.setItem(draftKey(pageId), JSON.stringify(debouncedDraft));
    } catch {
      // localStorage indisponível — autosave local só não funciona nesta sessão
    }
  }, [debouncedDraft, pageId]);

  function clearDraftStorage(id: number | null) {
    try {
      localStorage.removeItem(draftKey(id));
    } catch {
      // ignora
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim()) throw new Error("Título é obrigatório.");
      const payload = {
        title: draft.title.trim(),
        content: draft.content,
        slug: draft.slug.trim() || undefined,
        category_ids: draft.categoryIds,
        tag_ids: draft.tagIds,
        sidecard: rowsToSidecard(draft.sidecard),
      };
      if (pageId !== null) return pagesApi.update(pageId, payload);
      return pagesApi.create(payload);
    },
    onSuccess: (saved) => {
      clearDraftStorage(pageId);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      navigate(`/artigo/${saved.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  // Garante que o artigo exista no servidor antes de anexar imagem/link — cria como rascunho na hora.
  async function ensurePageId(): Promise<number> {
    if (pageId !== null) return pageId;
    if (!draft.title.trim()) {
      throw new Error("Dê um título ao artigo antes de inserir imagens ou links.");
    }
    const created = await pagesApi.create({
      title: draft.title.trim(),
      content: draft.content,
      slug: draft.slug.trim() || undefined,
      category_ids: draft.categoryIds,
      tag_ids: draft.tagIds,
      sidecard: rowsToSidecard(draft.sidecard),
    });
    clearDraftStorage(null);
    // Evita que o efeito de popular o formulário reabra com os dados que acabamos de
    // enviar e acuse divergência (ex.: slug vazio no form vs. auto-gerado no servidor).
    initializedForRef.current = created.id;
    setPageId(created.id);
    setDraft((d) => ({ ...d, slug: created.slug }));
    navigate(`/artigo/${created.id}/editar`, { replace: true });
    queryClient.invalidateQueries({ queryKey: ["pages"] });
    return created.id;
  }

  const uploadMutation = useMutation({
    mutationFn: async ({ file, alt }: { file: File; alt: string }) => {
      const id = await ensurePageId();
      return imagesApi.upload(id, file, alt);
    },
    onSuccess: (image) => {
      insertAtCursor(textareaRef, `![${image.alt_text}](${image.public_url})`, draft.content, (next) =>
        setDraft((d) => ({ ...d, content: next })),
      );
      setPendingImage(null);
      setImageAlt("");
      if (pageId !== null) queryClient.invalidateQueries({ queryKey: ["pages", pageId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const linkMutation = useMutation({
    mutationFn: async (target: { id: number; title: string }) => {
      const id = await ensurePageId();
      try {
        await pagesApi.link(id, target.id);
      } catch (err) {
        // Link estrutural já existe (ex.: usuário referencia o mesmo artigo duas vezes
        // no texto) — não é um erro do ponto de vista de quem está escrevendo.
        if (!(err instanceof ApiRequestError) || err.status !== 409) throw err;
      }
      return target;
    },
    onSuccess: (target) => {
      insertAtCursor(textareaRef, `[${target.title}](/artigo/${target.id})`, draft.content, (next) =>
        setDraft((d) => ({ ...d, content: next })),
      );
      setShowLinkPanel(false);
      setLinkQuery("");
      if (pageId !== null) queryClient.invalidateQueries({ queryKey: ["pages", pageId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingImage(file);
      setImageAlt("");
    }
    e.target.value = "";
  }

  function confirmImageUpload() {
    if (!pendingImage || !imageAlt.trim()) return;
    uploadMutation.mutate({ file: pendingImage, alt: imageAlt.trim() });
  }

  function toggleCategory(catId: number) {
    setDraft((d) => ({
      ...d,
      categoryIds: d.categoryIds.includes(catId)
        ? d.categoryIds.filter((x) => x !== catId)
        : [...d.categoryIds, catId],
    }));
  }

  function toggleTag(tagId: number) {
    setDraft((d) => ({
      ...d,
      tagIds: d.tagIds.includes(tagId) ? d.tagIds.filter((x) => x !== tagId) : [...d.tagIds, tagId],
    }));
  }

  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagsApi.create(name),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setDraft((d) => ({ ...d, tagIds: [...d.tagIds, tag.id] }));
      setNewTagName("");
    },
  });

  function addSidecardRow() {
    setDraft((d) => ({ ...d, sidecard: [...d.sidecard, { key: "", value: "" }] }));
  }
  function updateSidecardRow(index: number, field: "key" | "value", value: string) {
    setDraft((d) => ({
      ...d,
      sidecard: d.sidecard.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  }
  function removeSidecardRow(index: number) {
    setDraft((d) => ({ ...d, sidecard: d.sidecard.filter((_, i) => i !== index) }));
  }

  const previewSidecard = useMemo(() => rowsToSidecard(draft.sidecard), [draft.sidecard]);

  if (editingId !== null && existing.isLoading) return <p>Carregando artigo…</p>;
  if (editingId !== null && existing.isError) return <p>Não foi possível carregar este artigo.</p>;

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <input
          className={styles.titleInput}
          placeholder="Título do artigo"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
      </div>

      <div className={styles.actionBar}>
        <button
          className={styles.saveButton}
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Salvando…" : "Salvar"}
        </button>

        {draftBanner && (
          <div className={styles.banner}>
            <span>Rascunho não salvo encontrado nesta sessão.</span>
            <button
              onClick={() => {
                setDraft(draftBanner);
                setDraftBanner(null);
              }}
            >
              Restaurar
            </button>
            <button
              onClick={() => {
                clearDraftStorage(pageId);
                setDraftBanner(null);
              }}
            >
              Descartar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.formatGroup}>
          <button
            type="button"
            className={styles.formatButton}
            title="Negrito (**texto**)"
            onClick={() =>
              wrapSelection(textareaRef, "**", draft.content, (next) =>
                setDraft((d) => ({ ...d, content: next })),
              )
            }
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={styles.formatButton}
            title="Itálico (*texto*)"
            onClick={() =>
              wrapSelection(textareaRef, "*", draft.content, (next) =>
                setDraft((d) => ({ ...d, content: next })),
              )
            }
          >
            <em>I</em>
          </button>
          <span className={styles.formatDivider} aria-hidden="true" />
          <button
            type="button"
            className={styles.formatButton}
            title="Título grande na linha atual (##)"
            onClick={() =>
              toggleHeadingLine(textareaRef, 2, draft.content, (next) =>
                setDraft((d) => ({ ...d, content: next })),
              )
            }
          >
            Grande
          </button>
          <button
            type="button"
            className={styles.formatButton}
            title="Título médio na linha atual (###)"
            onClick={() =>
              toggleHeadingLine(textareaRef, 3, draft.content, (next) =>
                setDraft((d) => ({ ...d, content: next })),
              )
            }
          >
            Médio
          </button>
          <button
            type="button"
            className={styles.formatButton}
            title="Título pequeno na linha atual (####)"
            onClick={() =>
              toggleHeadingLine(textareaRef, 4, draft.content, (next) =>
                setDraft((d) => ({ ...d, content: next })),
              )
            }
          >
            Pequeno
          </button>
        </div>
        <label className={styles.toolbarButton}>
          Inserir imagem
          <input type="file" accept="image/*" hidden onChange={handleFileSelected} />
        </label>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => setShowLinkPanel((v) => !v)}
        >
          Inserir link
        </button>
        <input
          className={styles.slugInput}
          placeholder="slug (opcional, auto-gerado do título)"
          value={draft.slug}
          onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
        />
      </div>

      {pendingImage && (
        <div className={styles.inlinePanel}>
          <span>{pendingImage.name}</span>
          <input
            className={styles.inlineInput}
            placeholder="Texto alternativo (obrigatório)"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            autoFocus
          />
          <button onClick={confirmImageUpload} disabled={!imageAlt.trim() || uploadMutation.isPending}>
            {uploadMutation.isPending ? "Enviando…" : "Confirmar"}
          </button>
          <button onClick={() => setPendingImage(null)}>Cancelar</button>
        </div>
      )}

      {showLinkPanel && (
        <div className={styles.inlinePanel}>
          <input
            className={styles.inlineInput}
            placeholder="Buscar artigo para linkar…"
            value={linkQuery}
            onChange={(e) => setLinkQuery(e.target.value)}
            autoFocus
          />
          <ul className={styles.linkResults}>
            {linkResults.data?.map((p) => (
              <li key={p.id}>
                <button onClick={() => linkMutation.mutate({ id: p.id, title: p.title })}>
                  {p.title}
                </button>
              </li>
            ))}
            {debouncedLinkQuery.trim().length > 1 && linkResults.data?.length === 0 && (
              <li className={styles.noResults}>Nenhum artigo encontrado.</li>
            )}
          </ul>
        </div>
      )}

      <div className={styles.editGrid}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Escreva em markdown…"
          value={draft.content}
          onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
        />
        <div className={styles.previewPane}>
          <MarkdownRenderer content={draft.content || "*Preview aparece aqui.*"} />
        </div>
      </div>

      <div className={styles.metaGrid}>
        <section>
          <h3>Categorias</h3>
          <div className={styles.checkList}>
            {categoriesQuery.data?.map((cat) => (
              <label key={cat.id} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={draft.categoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                {cat.category_name}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>Tags</h3>
          <div className={styles.tagChips}>
            {tagsQuery.data?.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={draft.tagIds.includes(tag.id) ? styles.tagChipActive : styles.tagChip}
                onClick={() => toggleTag(tag.id)}
              >
                #{tag.tag_name}
              </button>
            ))}
          </div>
          <div className={styles.newTagRow}>
            <input
              className={styles.inlineInput}
              placeholder="Nova tag…"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTagName.trim()) {
                  e.preventDefault();
                  createTagMutation.mutate(newTagName.trim());
                }
              }}
            />
            <button
              disabled={!newTagName.trim() || createTagMutation.isPending}
              onClick={() => createTagMutation.mutate(newTagName.trim())}
            >
              Criar
            </button>
          </div>
        </section>

        <section>
          <div className={styles.sidecardHeader}>
            <h3>Infobox (sidecard)</h3>
            <button type="button" onClick={addSidecardRow}>
              + campo
            </button>
          </div>
          {draft.sidecard.map((row, i) => (
            <div key={i} className={styles.sidecardRow}>
              <input
                placeholder="chave"
                value={row.key}
                onChange={(e) => updateSidecardRow(i, "key", e.target.value)}
              />
              <input
                placeholder="valor"
                value={row.value}
                onChange={(e) => updateSidecardRow(i, "value", e.target.value)}
              />
              <button type="button" onClick={() => removeSidecardRow(i)}>
                ×
              </button>
            </div>
          ))}
          {previewSidecard && (
            <p className={styles.sidecardHint}>
              {Object.keys(previewSidecard).length} campo(s) preenchido(s)
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
