import asyncio
import importlib

import pytest


def test_missing_database_url_fails_lazily(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    database = importlib.reload(importlib.import_module("app.database"))

    assert database.SessionLocal is None

    with pytest.raises(RuntimeError, match="DATABASE_URL is not set"):
        asyncio.run(database.get_db().__anext__())
