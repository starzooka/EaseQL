import asyncio
import io
import re
from unittest.mock import patch

import duckdb
import pytest
from fastapi import HTTPException, UploadFile

from app.services import upload_service


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


def test_store_csv_upload_registers_multiple_datasets_without_overwriting(tmp_path, monkeypatch):
    database_path = tmp_path / "uploads.duckdb"
    monkeypatch.setattr(upload_service, "DATABASE_PATH", database_path)

    uploads = [
        ("customers.csv", b"customer_id,name\n1,Ada\n"),
        ("orders.csv", b"order_id,customer_id\n10,1\n"),
        ("products.csv", b"product_id,title\n100,Widget\n"),
    ]

    payloads = [
        asyncio.run(
            upload_service.store_csv_upload(
                UploadFile(file=io.BytesIO(content), filename=filename),
                user_id=17,
            )
        )
        for filename, content in uploads
    ]

    assert [payload["filename"] for payload in payloads] == [item[0] for item in uploads]
    assert len({payload["table"] for payload in payloads}) == 3
    with duckdb.connect(str(database_path), read_only=True) as connection:
        for payload in payloads:
            assert connection.sql(f'SELECT COUNT(*) FROM "{payload["table"]}"').fetchone()[0] == 1


def test_store_csv_upload_rejects_duplicate_table_name(tmp_path, monkeypatch):
    database_path = tmp_path / "uploads.duckdb"
    monkeypatch.setattr(upload_service, "DATABASE_PATH", database_path)
    duplicate_uuid = "0123456789abcdef0123456789abcdef"
    file_content = b"id\n1\n"

    with patch.object(upload_service.uuid, "uuid4", return_value=type("UUID", (), {"hex": duplicate_uuid})()):
        asyncio.run(
            upload_service.store_csv_upload(
                UploadFile(file=io.BytesIO(file_content), filename="first.csv"),
                user_id=17,
            )
        )
        with pytest.raises(HTTPException, match="Could not load file"):
            asyncio.run(
                upload_service.store_csv_upload(
                    UploadFile(file=io.BytesIO(file_content), filename="second.csv"),
                    user_id=17,
                )
            )
