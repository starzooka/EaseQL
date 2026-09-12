import os
import uuid
import asyncio

os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret")

import pytest
from fastapi.testclient import TestClient

from app import database
from app.main import app
from app.services import sql_service, upload_service


@pytest.fixture
def duckdb_database(tmp_path, monkeypatch):
    database_path = tmp_path / "test.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)
    monkeypatch.setattr(upload_service, "DATABASE_PATH", database_path)
    return database_path


@pytest.fixture
def client(duckdb_database):
    with TestClient(app) as test_client:
        yield test_client
    asyncio.run(database.engine.dispose())


@pytest.fixture
def authenticated_client(client):
    email = f"test-{uuid.uuid4().hex}@example.com"
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "test-password-123"},
    )
    assert response.status_code == 201, response.text
    return client
