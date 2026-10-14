"""Publicacao de artigos no repositorio de conteudo no GitHub.

Fluxo: GitHub primeiro, banco depois. O hash SHA-256 aqui calculado cobre
titulo + slug + categorias + tags + sidecard + corpo (tudo que vai pro
arquivo), e serve pra decidir se um novo commit e necessario. E distinto do
`sha` de blob que a Contents API do GitHub exige pra aceitar um update sem
sobrescrever uma mudanca concorrente.
"""
import base64
import hashlib

import httpx
import yaml

from app.core import settings
from app.models import Page

GITHUB_API = "https://api.github.com"


class GitHubPublishError(Exception):
    """Erro de comunicacao ou resposta inesperada do GitHub."""


class GitHubConflictError(Exception):
    """O arquivo no GitHub mudou desde a ultima leitura (sha divergente)."""


def _normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _front_matter(page: Page) -> dict:
    return {
        "title": page.title,
        "slug": page.slug,
        "categories": sorted(c.category_name for c in page.categories),
        "tags": sorted(t.tag_name for t in page.tags),
        "sidecard": page.sidecard or {},
    }


def render_article_document(page: Page) -> bytes:
    """Serializacao canonica do artigo: mesmo conteudo sempre gera os mesmos bytes."""
    front_matter = yaml.safe_dump(
        _front_matter(page),
        sort_keys=True,
        allow_unicode=True,
        default_flow_style=False,
    )
    body = _normalize_newlines(page.content).strip("\n")
    document = f"---\n{front_matter}---\n\n{body}\n"
    return document.encode("utf-8")


def content_hash(document: bytes) -> str:
    return hashlib.sha256(document).hexdigest()


def article_path(page: Page) -> str:
    return f"articles/{page.slug}.md"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def get_remote_file(path: str) -> tuple[bytes, str] | None:
    """Retorna (conteudo, sha_do_blob) do arquivo no branch configurado, ou None se nao existir."""
    url = f"{GITHUB_API}/repos/{settings.github_content_repo}/contents/{path}"
    try:
        response = httpx.get(
            url,
            headers=_headers(),
            params={"ref": settings.github_branch},
            timeout=10,
        )
    except httpx.HTTPError as e:
        raise GitHubPublishError(f"Falha ao consultar o GitHub: {e}") from e

    if response.status_code == 404:
        return None
    if response.status_code != 200:
        raise GitHubPublishError(
            f"GitHub retornou {response.status_code} ao consultar {path}: {response.text}"
        )

    data = response.json()
    return base64.b64decode(data["content"]), data["sha"]


def put_remote_file(path: str, document: bytes, message: str, sha: str | None) -> str:
    """Cria ou atualiza o arquivo no branch configurado. Retorna o sha do commit criado."""
    url = f"{GITHUB_API}/repos/{settings.github_content_repo}/contents/{path}"
    payload = {
        "message": message,
        "content": base64.b64encode(document).decode("ascii"),
        "branch": settings.github_branch,
        "committer": {
            "name": settings.github_commit_author_name,
            "email": settings.github_commit_author_email,
        },
    }
    if sha is not None:
        payload["sha"] = sha

    try:
        response = httpx.put(url, headers=_headers(), json=payload, timeout=15)
    except httpx.HTTPError as e:
        raise GitHubPublishError(f"Falha ao publicar no GitHub: {e}") from e

    if response.status_code == 409:
        raise GitHubConflictError(
            "O arquivo no GitHub mudou desde a ultima leitura. Publicacao abortada."
        )
    if response.status_code not in (200, 201):
        raise GitHubPublishError(
            f"GitHub retornou {response.status_code} ao publicar {path}: {response.text}"
        )

    return response.json()["commit"]["sha"]
