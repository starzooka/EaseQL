import duckdb
import pytest

from app.services import sql_service


def test_execute_read_only_query(tmp_path, monkeypatch):
    database_path = tmp_path / "test.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)
    with duckdb.connect(str(database_path)) as connection:
        connection.execute("CREATE TABLE uploaded_data AS SELECT range AS id FROM range(600)")

    result = sql_service.execute_read_only_query("SELECT * FROM uploaded_data ORDER BY id")
    assert result["columns"] == ["id"]
    assert result["row_count"] == 500
    assert result["capped_at"] == 500
    assert result["rows"][0]["id"] == 0

    with pytest.raises(ValueError):
        sql_service.execute_read_only_query("CREATE TABLE unsafe AS SELECT 1")

    with pytest.raises(ValueError):
        sql_service.execute_read_only_query("SELECT 1; SELECT 2")
