from fastapi.testclient import TestClient

from app.main import app


response = TestClient(app).post(
    "/upload",
    files={
        "file": (
            "data.csv",
            b"id,created_date,amount\n1,2026-01-02,12.5\n",
            "text/csv",
        )
    },
)

assert response.status_code == 200, response.text
payload = response.json()
assert payload["row_count"] == 1
assert payload["sanity_check"]["passed"] is True
assert 'TABLE "uploaded_data"' in payload["schema_text"]
assert '"created_date" DATE' in payload["schema_text"]
assert '"amount" DOUBLE' in payload["schema_text"]
assert '"id":1' in payload["schema_text"]
print(payload)
