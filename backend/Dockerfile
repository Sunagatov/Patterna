FROM ghcr.io/astral-sh/uv:0.9.29 AS uv
FROM python:3.12-slim-bookworm

WORKDIR /app
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1
COPY --from=uv /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project && \
    groupadd --system patterna && useradd --system --gid patterna patterna
COPY alembic.ini ./
COPY migrations/ migrations/
COPY patterna/ patterna/
USER patterna
EXPOSE 8000
CMD ["uvicorn", "patterna.main:app", "--host", "0.0.0.0", "--port", "8000"]
