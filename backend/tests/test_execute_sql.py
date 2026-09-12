import duckdb
import pytest

from app.services import sql_service


<<<<<<< HEAD
def test_read_only_query_is_capped_and_rejects_writes(tmp_path, monkeypatch):
    database_path = tmp_path / "test.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)

    with duckdb.connect(str(database_path)) as connection:
        connection.execute("CREATE TABLE uploaded_data AS SELECT range AS id FROM range(600)")

=======
def test_execute_read_only_query(tmp_path, monkeypatch):
    database_path = tmp_path / "test.duckdb"
    monkeypatch.setattr(sql_service, "DATABASE_PATH", database_path)
    with duckdb.connect(str(database_path)) as connection:
        connection.execute("CREATE TABLE uploaded_data AS SELECT range AS id FROM range(600)")

>>>>>>> d73bd6bab1cb33525daa998f2d61a36f6880df6b
    result = sql_service.execute_read_only_query("SELECT * FROM uploaded_data ORDER BY id")
    assert result["columns"] == ["id"]
    assert result["row_count"] == 500
    assert result["capped_at"] == 500
    assert result["rows"][0]["id"] == 0

<<<<<<< HEAD
    for statement, message in [
        ("CREATE TABLE unsafe AS SELECT 1", "Write query was not rejected"),
        ("SELECT 1; SELECT 2", "Multiple statements were not rejected"),
    ]:
        try:
            sql_service.execute_read_only_query(statement)
        except ValueError:
            pass
        else:
            raise AssertionError(message)
=======
    with pytest.raises(ValueError):
        sql_service.execute_read_only_query("CREATE TABLE unsafe AS SELECT 1")

    with pytest.raises(ValueError):
        sql_service.execute_read_only_query("SELECT 1; SELECT 2")
>>>>>>> d73bd6bab1cb33525daa998f2d61a36f6880df6b
