import re
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app import auth, database
from app.main import app
from app.models import Dataset, User
from app.routers import query as query_router
from app.services import sql_service, upload_service


class FakeResult:
    def __init__(self, scalar=None, rows=None):
        self.scalar = scalar
        self.rows = rows or []

    def scalar_one_or_none(self):
        return self.scalar

    def scalars(self):
        return self

    def all(self):
        return self.rows


class FakeSession:
    def __init__(self):
        self.dataset = None
        self.execute_count = 0
        self.history = None

    async def execute(self, statement):
        self.execute_count += 1
        if self.execute_count == 1:
            return FakeResult(self.dataset)
        return FakeResult(rows=[])

    def add(self, entity):
        if isinstance(entity, Dataset):
            self.dataset = entity
        else:
            self.history = entity

    async def commit(self):
        pass

    async def refresh(self, entity):
        if isinstance(entity, Dataset):
            entity.id = 1


class FakeOllamaResponse:
    def __init__(self, table_name):
        self.table_name = table_name

    def raise_for_status(self):
        pass

    def json(self):
        return {"choices": [{"message": {"content": f'SELECT * FROM "{self.table_name}" LIMIT 5'}}]}


class FakeOllamaClient:
    def __init__(self, timeout):
        assert timeout == 180

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        pass

    async def post(self, url, json):
        assert url == sql_service.OLLAMA_CHAT_URL
        user_prompt = json["messages"][1]["content"]
        table_name = re.search(r'TABLE: "([^"]+)"', user_prompt).group(1)
        assert "show the first five sales rows" in user_prompt
        return FakeOllamaResponse(table_name)


def test_authenticated_upload_query_flow(tmp_path, monkeypatch):
    database_path = tmp_path / "query.duckdb"
    monkeypatch.setattr(upload_service, "DATABASE_PATH", database_path)
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)

    session = FakeSession()
    user = User(id=7, email="e2e@example.com", hashed_password="unused")

    async def override_db():
        yield session

    app.dependency_overrides[query_router.get_db] = override_db
    client = TestClient(app)
    sample_path = Path(__file__).with_name("sample_sales.csv")

    try:
        with sample_path.open("rb") as sample_file:
            response = client.post(
                "/api/upload",
                files={"file": (sample_path.name, sample_file, "text/csv")},
            )
        assert response.status_code == 401

        app.dependency_overrides[auth.get_current_user] = lambda: user
        with sample_path.open("rb") as sample_file:
            upload_response = client.post(
                "/api/upload",
                files={"file": (sample_path.name, sample_file, "text/csv")},
            )

        assert upload_response.status_code == 200, upload_response.text
        upload = upload_response.json()
        assert upload["dataset_id"] == 1
        assert re.fullmatch(r"user_7_[0-9a-f]{32}", upload["table"])
        assert upload["row_count"] == 8

        with patch("app.services.sql_service.httpx.AsyncClient", FakeOllamaClient):
            query_response = client.post(
                "/api/query",
                json={
                    "table_name": upload["table"],
                    "natural_language_query": "show the first five sales rows",
                    "dataset_id": upload["dataset_id"],
                },
            )

        assert query_response.status_code == 200, query_response.text
        result = query_response.json()
        assert result["sql"] == f'SELECT * FROM "{upload["table"]}" LIMIT 5'
        assert len(result["results"]) == 5
        assert result["results"][0]["region"] == "North"
    finally:
        app.dependency_overrides.clear()