import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


@lru_cache
def engine():
    connection_pool = create_engine(
        os.environ["PATTERNA_DATABASE_URL"],
        pool_pre_ping=True,
        pool_size=3,
        max_overflow=3,
        connect_args={"connect_timeout": 5},
        hide_parameters=True,
    )
    expected_schema = os.environ.get("PATTERNA_DATABASE_SCHEMA")
    if expected_schema:

        @event.listens_for(connection_pool, "connect")
        def check_schema(connection, _):
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_catalog.current_schemas(false)")
                if cursor.fetchone()[0] != [expected_schema]:
                    raise RuntimeError(
                        "The database role has an unexpected search path"
                    )
            connection.rollback()

    return connection_pool


def database():
    with Session(engine()) as session:
        yield session
