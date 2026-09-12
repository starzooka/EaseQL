from unittest.mock import patch


def test_generate_sql_endpoint_uses_current_service(authenticated_client):
    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": "Here you go:\n```sql\nSELECT COUNT(*) FROM uploaded_data;\n```"}}]}

    class FakeClient:
        def __init__(self, timeout):
            assert timeout == 180

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_value, traceback):
            return None

        async def post(self, url, json):
            assert json["messages"][0]["role"] == "system"
            assert "TABLE" in json["messages"][1]["content"]
            assert "largest amount" in json["messages"][1]["content"]
            return FakeResponse()

    with patch("app.services.sql_service.httpx.AsyncClient", FakeClient):
        response = authenticated_client.post(
            "/generate-sql",
            json={
                "schema_text": 'TABLE "uploaded_data" ("amount" DOUBLE);',
                "question": "Show the largest amount.",
            },
        )

    assert response.status_code == 200, response.text
    assert response.json()["sql"] == "SELECT COUNT(*) FROM uploaded_data;"
    assert response.json()["model"]
