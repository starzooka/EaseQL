import tempfile
from pathlib import Path

import duckdb

import app.main as main


with tempfile.TemporaryDirectory() as directory:
    main.DATABASE_PATH = Path(directory) / "test.duckdb"
    connection = duckdb.connect(str(main.DATABASE_PATH))
    connection.execute("CREATE TABLE uploaded_data AS SELECT range AS id FROM range(600)")
    connection.close()

    result = main._execute_read_only_query("SELECT * FROM uploaded_data ORDER BY id")
    assert result["columns"] == ["id"]
    assert result["row_count"] == 500
    assert result["capped_at"] == 500
    assert result["rows"][0]["id"] == 0

    try:
        main._execute_read_only_query("CREATE TABLE unsafe AS SELECT 1")
    except ValueError:
        pass
    else:
        raise AssertionError("Write query was not rejected")

    try:
        main._execute_read_only_query("SELECT 1; SELECT 2")
    except ValueError:
        pass
    else:
        raise AssertionError("Multiple statements were not rejected")

print("Read-only query checks passed")
