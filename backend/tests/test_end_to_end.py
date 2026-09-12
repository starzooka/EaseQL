from pathlib import Path
from unittest.mock import patch


class FakeOllamaResponse:
    def __init__(self, sql: str):
        self.sql = sql

    def raise_for_status(self):
        return None

    def json(self):
        return {"choices": [{"message": {"content": self.sql}}]}


def test_end_to_end_upload_query_flow(authenticated_client):
    sample_path = Path(__file__).with_name("sample_sales.csv")
    with sample_path.open("rb") as sample_file:
        upload_response = authenticated_client.post(
            "/api/upload",
            files={"file": (sample_path.name, sample_file, "text/csv")},
        )

    assert upload_response.status_code == 200, upload_response.text
    upload = upload_response.json()
    assert upload["row_count"] == 8

    class FakeOllamaClient:
        def __init__(self, timeout):
            assert timeout == 180

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_value, traceback):
            return None

        async def post(self, url, json):
            schema = json["messages"][1]["content"]
            table_name = schema.split('TABLE: "', 1)[1].split('"', 1)[0]
            return FakeOllamaResponse(f'SELECT * FROM "{table_name}" LIMIT 5')

    with patch("app.services.sql_service.httpx.AsyncClient", FakeOllamaClient):
        query_response = authenticated_client.post(
            "/api/query",
            json={
                "table_name": upload["table"],
                "dataset_id": upload["dataset_id"],
                "natural_language_query": "show the first five sales rows",
            },
        )

    assert query_response.status_code == 200, query_response.text
    result = query_response.json()
    assert result["sql"] == f'SELECT * FROM "{upload["table"]}" LIMIT 5'
    assert len(result["results"]) == 5
    assert result["results"][0]["region"] == "North"
