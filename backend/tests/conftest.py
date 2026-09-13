from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import sql_service, upload_service


@pytest.fixture(scope="session")
def client(tmp_path_factory):
    database_path = tmp_path_factory.mktemp("duckdb") / "query.duckdb"
    original_sql_path = sql_service.DATABASE_PATH
    original_upload_path = upload_service.DATABASE_PATH
    sql_service.DATABASE_PATH = database_path
    upload_service.DATABASE_PATH = database_path
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        sql_service.DATABASE_PATH = original_sql_path
        upload_service.DATABASE_PATH = original_upload_path


@pytest.fixture
def authenticated_client(client):
    email = f"test-{uuid4().hex}@example.com"
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": "Test-pass1!"},
    )
    assert response.status_code == 201, response.text
    return client
