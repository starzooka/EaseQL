import asyncio
from unittest.mock import patch

from app.services import sql_service


class FakeResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return {"choices": [{"message": {"content": "Here you go:\n```sql\nSELECT COUNT(*) FROM uploaded_data;\n```"}}]}


class FakeClient:
    def __init__(self, timeout):
        assert timeout == 180

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        pass

    async def post(self, url, json):
        assert url == sql_service.OLLAMA_CHAT_URL
        assert json["messages"][0]["role"] == "system"
        assert "safe, valid SQL" in json["messages"][0]["content"]
        assert "TABLE" in json["messages"][1]["content"]
        assert "largest amount" in json["messages"][1]["content"]
        return FakeResponse()


def test_generate_sql_cleans_ollama_response():
    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        result = asyncio.run(
            sql_service.generate_sql(
                schema_text='TABLE "uploaded_data" ("amount" DOUBLE);',
                question="Show the largest amount.",
            )
        )

    assert result == "SELECT COUNT(*) FROM uploaded_data;"
