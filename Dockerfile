FROM python:3.13-slim

# Instala o uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY . /app

RUN uv sync --frozen --no-cache

# Railway injeta a porta real via $PORT — precisa ser shell form pra variavel expandir
CMD /app/.venv/bin/fastapi run app/main.py --port $PORT --host 0.0.0.0
