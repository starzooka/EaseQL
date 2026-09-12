import duckdb

from app.services import sql_service


def test_execute_read_only_query_caps_results_and_rejects_writes(duckdb_database):
    with duckdb.connect(str(duckdb_database)) as connection:
        connection.execute("CREATE TABLE uploaded_data AS SELECT range AS id FROM range(600)")

    result = sql_service.execute_read_only_query("SELECT * FROM uploaded_data ORDER BY id")
    assert result["columns"] == ["id"]
    assert result["row_count"] == 500
    assert result["capped_at"] == 500
    assert result["rows"][0]["id"] == 0

    for statement in ("CREATE TABLE unsafe AS SELECT 1", "SELECT 1; SELECT 2"):
        try:
            sql_service.execute_read_only_query(statement)
        except ValueError:
            pass
        else:
            raise AssertionError("Unsafe SQL was not rejected")
