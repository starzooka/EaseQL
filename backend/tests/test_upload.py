<<<<<<< HEAD
def test_upload_csv_returns_current_dataset_contract(authenticated_client):
    response = authenticated_client.post(
        "/api/upload",
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
    assert set(payload) == {"dataset_id", "table", "row_count"}
    assert payload["dataset_id"] > 0
    assert payload["table"].startswith("user_")
    assert payload["row_count"] == 1
=======
import asyncio
import io
import re

import duckdb
from fastapi import UploadFile

from app.services import upload_service


def test_store_csv_upload_detects_schema_and_sanity_warnings(tmp_path, monkeypatch):
    database_path = tmp_path / "uploads.duckdb"
    monkeypatch.setattr(upload_service, "DATABASE_PATH", database_path)
    file = UploadFile(
        file=io.BytesIO(b"id,created_date,amount\n1,2026-01-02,12.5\n"),
        filename="data.csv",
    )

    payload = asyncio.run(upload_service.store_csv_upload(file, user_id=17))

    assert payload["filename"] == "data.csv"
    assert payload["row_count"] == 1
    assert re.fullmatch(r"user_17_[0-9a-f]{32}", payload["table"])
    assert {column["name"] for column in payload["columns"]} == {"id", "created_date", "amount"}
    assert payload["sanity_check"]["passed"] is True
    with duckdb.connect(str(database_path), read_only=True) as connection:
        assert connection.sql(f'SELECT COUNT(*) FROM "{payload["table"]}"').fetchone()[0] == 1
>>>>>>> d73bd6bab1cb33525daa998f2d61a36f6880df6b
