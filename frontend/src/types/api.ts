// Espelha app/schemas/*.py do back-end. Ver docs/frontend-brief.md para o contrato completo.

export type Sidecard = Record<string, unknown> | null;

export interface CategoryRead {
  id: number;
  parent_id: number | null;
  category_name: string;
}

export interface CategoryTree extends CategoryRead {
  children: CategoryTree[];
}

export interface TagRead {
  id: number;
  tag_name: string;
}

export interface ImageRead {
  id: number;
  page_id: number;
  storage_key: string;
  alt_text: string;
  mime_type: string;
  public_url: string;
}

export interface PageSummary {
  id: number;
  title: string;
  slug: string;
}

export interface PageRead {
  id: number;
  title: string;
  sidecard: Sidecard;
  content: string;
  slug: string;
  categories: CategoryRead[];
  tags: TagRead[];
  images: ImageRead[];
  outgoing_page_ids: number[];
  incoming_page_ids: number[];
}

export interface PageCreate {
  title: string;
  sidecard?: Sidecard;
  content?: string;
  slug?: string | null;
  category_ids?: number[];
  tag_ids?: number[];
}

export interface PageUpdate {
  title?: string;
  sidecard?: Sidecard;
  content?: string;
  slug?: string | null;
  category_ids?: number[];
  tag_ids?: number[];
}

export interface ApiError {
  detail: string;
}
