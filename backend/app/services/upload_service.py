import re
import tempfile
import uuid
from pathlib import Path

import duckdb
from fastapi import HTTPException, UploadFile, status

from .sql_service import DATABASE_PATH, quoted_identifier, sql_path

MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024


def _is_numeric(value: str) -> bool:
    try:
        float(value.replace(",", ""))
        return True
    except ValueError:
        return False


def _is_date(value: str) -> bool:
    return bool(re.fullmatch(r"\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T].*)?", value))


def sanity_check(connection: duckdb.DuckDBPyConnection, table_name: str, columns: list[dict[str, str]]) -> list[dict[str, str]]:
    warnings = []
    for column in columns:
        if column["type"] not in {"VARCHAR", "STRING"}:
            continue

        name = column["name"]
        quoted_name = quoted_identifier(name)
        values = connection.sql(
            f"SELECT {quoted_name} FROM {quoted_identifier(table_name)} "
            f"WHERE {quoted_name} IS NOT NULL LIMIT 100"
        ).fetchall()
        text_values = [str(value[0]).strip() for value in values if str(value[0]).strip()]
        if not text_values:
            continue

        numeric_name = bool(re.search(r"(^|_)(id|count|amount|total|price|number|quantity|value)(_|$)", name.lower()))
        date_name = bool(re.search(r"(^|_)(date|time|timestamp|created|updated|birth)(_|$)", name.lower()))
        if numeric_name and all(_is_numeric(value) for value in text_values):
            warnings.append({"column": name, "message": "Numeric-looking values were inferred as strings."})
        elif date_name and all(_is_date(value) for value in text_values):
            warnings.append({"column": name, "message": "Date-looking values were inferred as strings."})
    return warnings


async def store_csv_upload(file: UploadFile, user_id: int) -> dict:
    filename = Path(file.filename or "").name
    if Path(filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=415, detail="Only .csv files are supported")

    content = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="The uploaded file is too large")

    table_name = f"user_{user_id}_{uuid.uuid4().hex}"
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / filename
        path.write_bytes(content)
        try:
            DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with duckdb.connect(str(DATABASE_PATH)) as connection:
                quoted_table = quoted_identifier(table_name)
                connection.execute(
                    f"CREATE TABLE {quoted_table} AS "
                    f"SELECT * FROM read_csv_auto('{sql_path(path)}')"
                )
                description = connection.sql(f"DESCRIBE {quoted_table}").fetchall()
                columns = [{"name": row[0], "type": row[1]} for row in description]
                row_count = connection.sql(f"SELECT COUNT(*) FROM {quoted_table}").fetchone()[0]
                warnings = sanity_check(connection, table_name, columns)
        except (duckdb.Error, OSError) as error:
            raise HTTPException(status_code=400, detail=f"Could not load file: {error}") from error

    return {
        "filename": filename,
        "table": table_name,
        "row_count": row_count,
        "columns": columns,
        "sanity_check": {"passed": not warnings, "warnings": warnings},
    }
