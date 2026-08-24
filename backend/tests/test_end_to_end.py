import json
from pathlib import Path

from fastapi.testclient import TestClient

import app.main as main


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

sql_response = client.post(
    "/generate-sql",
    json={
        "schema_text": upload["schema_text"],
        "question": "what are total sales by region?",
    },
)
assert sql_response.status_code == 200, sql_response.text
sql = sql_response.json()["sql"]
print(f"Generated SQL: {sql}")

query_response = client.post("/execute-sql", json={"sql": sql})
assert query_response.status_code == 200, query_response.text
result = query_response.json()
print(json.dumps(result, indent=2, default=str))

actual = {row["region"]: row["total_sales"] for row in result["rows"]}
expected = {"North": 150, "South": 325, "East": 300, "West": 350}
assert actual == expected, f"Expected {expected}, got {actual}"
print("End-to-end ingestion -> schema -> SQL -> execution -> output check passed")
