import json
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import app.main as main


class FakeOllamaResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {"choices": [{"message": {"content": "SELECT * FROM uploaded_data LIMIT 5"}}]}


async def fake_ollama_post(self, url, json):
    return FakeOllamaResponse()


main.OLLAMA_MODEL = "qwen2.5-coder:latest"
sample_path = Path(__file__).with_name("sample_sales.csv")
client = TestClient(main.app)

with sample_path.open("rb") as sample_file:
    upload_response = client.post(
        "/upload",
        files={"file": (sample_path.name, sample_file, "text/csv")},
    )

assert upload_response.status_code == 200, upload_response.text
upload = upload_response.json()
assert upload["row_count"] == 8
assert '"region" VARCHAR' in upload["schema_text"]
assert '"sales" BIGINT' in upload["schema_text"]

with patch("app.main.httpx.AsyncClient.post", new=fake_ollama_post):
    query_response = client.post(
        "/api/query",
        json={
            "table_name": "uploaded_data",
            "natural_language_query": "show the first five sales rows",
        },
    )

assert query_response.status_code == 200, query_response.text
result = query_response.json()
print(json.dumps(result, indent=2, default=str))

assert result["sql"] == "SELECT * FROM uploaded_data LIMIT 5"
assert len(result["results"]) == 5
assert result["results"][0]["region"] == "North"
print("End-to-end ingestion -> mocked SQL generation -> execution -> output check passed")
