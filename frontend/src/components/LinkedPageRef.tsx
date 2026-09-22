import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { pagesApi } from "../api/pages";

interface LinkedPageRefProps {
  pageId: number;
  onRemove?: () => void;
  removing?: boolean;
}

export function LinkedPageRef({ pageId, onRemove, removing }: LinkedPageRefProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["pages", pageId],
    queryFn: () => pagesApi.get(pageId),
    staleTime: 60_000,
  });

  if (isLoading || !data) return <li>Carregando…</li>;

  return (
    <li>
      <Link to={`/artigo/${data.id}`}>{data.title}</Link>
      {onRemove && (
        <button onClick={onRemove} disabled={removing} aria-label={`Remover link para ${data.title}`}>
          {removing ? "removendo…" : "remover"}
        </button>
      )}
    </li>
  );
}
