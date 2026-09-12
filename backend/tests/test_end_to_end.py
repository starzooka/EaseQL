from pathlib import Path
from unittest.mock import patch


class FakeOllamaResponse:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def raise_for_status(self):
        return None

    def json(self):
        return {"choices": [{"message": {"content": f'SELECT * FROM "{self.table_name}" LIMIT 5'}}]}


class FakeAsyncClient:
    def __init__(self, timeout: int, table_name: str):
        assert timeout == 180
        self.table_name = table_name

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        return None

    async def post(self, url, json):
        return FakeOllamaResponse(self.table_name)


def test_upload_query_end_to_end(authenticated_client):
    sample_path = Path(__file__).with_name("sample_sales.csv")
    with sample_path.open("rb") as sample_file:
        upload_response = authenticated_client.post(
            "/api/upload",
            files={"file": (sample_path.name, sample_file, "text/csv")},
        )

    assert upload_response.status_code == 200, upload_response.text
    upload = upload_response.json()
    assert upload["row_count"] == 8

    fake_client = lambda timeout: FakeAsyncClient(timeout, upload["table"])
    with patch("app.services.sql_service.httpx.AsyncClient", fake_client):
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
