import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# alembic.ini의 로깅 설정 적용
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 환경변수 DATABASE_URL 우선 적용
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# 모델 메타데이터 import (autogenerate용)
from app.core.database import Base  # noqa: E402
import app.models.crew  # noqa: E402, F401 — 모델 등록

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
