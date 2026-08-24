import json
import os
import re
import tempfile
import threading
from pathlib import Path

import duckdb
import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Query NLP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://localhost:11434/v1/chat/completions")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:latest")
DATABASE_PATH = Path(os.getenv("DUCKDB_PATH", Path(__file__).resolve().parents[1] / "data" / "query.duckdb"))
TEXT_TO_SQL_PROMPT_PATH = Path(__file__).resolve().parents[2] / "local-llm" / "prompts" / "text-to-sql.txt"
QUERY_TIMEOUT = os.getenv("DUCKDB_QUERY_TIMEOUT", "5s")
MAX_QUERY_ROWS = 500
SQL_SYSTEM_PROMPT = """You generate safe, valid SQL for DuckDB.
Use only the tables and columns in the supplied schema. Never invent schema elements.
Return exactly one SQL statement and nothing else. Do not include explanations, comments,
labels, JSON, or markdown fences. Do not execute destructive statements such as DROP,
DELETE, UPDATE, INSERT, or ALTER. Prefer a LIMIT 100 for unbounded result lists.
"""


class SQLRequest(BaseModel):
    question: str = Field(min_length=1)
    schema_text: str = Field(min_length=1)


class QueryRequest(BaseModel):
    sql: str = Field(min_length=1)


class APIQueryRequest(BaseModel):
    table_name: str = Field(min_length=1)
    natural_language_query: str = Field(min_length=1)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "query-nlp", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


def _clean_sql_response(raw_text: str) -> str:
    text = raw_text.strip()
    fenced_match = re.search(r"```(?:sql)?\s*(.*?)```", text, flags=re.IGNORECASE | re.DOTALL)
    if fenced_match:
        text = fenced_match.group(1).strip()
    text = re.sub(r"^SQL\s*:\s*", "", text, flags=re.IGNORECASE)
    statement_start = re.search(r"\b(?:SELECT|WITH|VALUES)\b", text, flags=re.IGNORECASE)
    if statement_start:
        text = text[statement_start.start():]
    text = re.sub(r"```\s*$", "", text).strip()
    if not text:
        raise ValueError("Ollama returned an empty SQL response")
    return text


def _format_text_to_sql_prompt(schema_context: str, question: str) -> str:
    prompt_template = TEXT_TO_SQL_PROMPT_PATH.read_text(encoding="utf-8")
    return (
        prompt_template
        .replace("{{schema_text}}", schema_context)
        .replace("{{sample_data}}", "")
        .replace("{{question}}", question)
    )


def _execute_read_only_query(sql: str) -> dict:
    statement = sql.strip()
    if statement.endswith(";"):
        statement = statement[:-1].rstrip()
    if ";" in statement or not re.match(r"^(SELECT|WITH|VALUES)\b", statement, flags=re.IGNORECASE):
        raise ValueError("Only one SELECT, WITH, or VALUES statement is allowed")

    connection = duckdb.connect(str(DATABASE_PATH), read_only=True)
    timeout_match = re.fullmatch(r"(\d+(?:\.\d+)?)(ms|s|m)", QUERY_TIMEOUT.strip().lower())
    if not timeout_match:
        connection.close()
        raise ValueError("DUCKDB_QUERY_TIMEOUT must use a duration such as 500ms, 5s, or 1m")
    timeout_value, timeout_unit = timeout_match.groups()
    timeout_seconds = float(timeout_value) * {"ms": 0.001, "s": 1, "m": 60}[timeout_unit]
    interrupt_timer = threading.Timer(timeout_seconds, connection.interrupt)
    interrupt_timer.daemon = True
    interrupt_timer.start()
    try:
        result = connection.sql(f"SELECT * FROM ({statement}) AS limited_query LIMIT {MAX_QUERY_ROWS}")
        columns = [column[0] for column in result.description]
        rows = [
            dict(zip(columns, row))
            for row in result.fetchall()
        ]
        return {
            "sql": statement,
            "columns": columns,
            "row_count": len(rows),
            "capped_at": MAX_QUERY_ROWS,
            "rows": rows,
        }
    finally:
        interrupt_timer.cancel()
        connection.close()


@app.post("/execute-sql")
def execute_sql(request: QueryRequest) -> dict:
    try:
        return _execute_read_only_query(request.sql)
    except (duckdb.Error, ValueError) as error:
        raise HTTPException(status_code=400, detail=f"Query could not be executed: {error}") from error


@app.post("/generate-sql")
async def generate_sql(request: SQLRequest) -> dict[str, str]:
    user_prompt = f"SCHEMA:\n{request.schema_text}\n\nQUESTION:\n{request.question}"
    payload = {
        "model": OLLAMA_MODEL,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": SQL_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(OLLAMA_CHAT_URL, json=payload)
            response.raise_for_status()
            raw_text = response.json()["choices"][0]["message"]["content"]
            sql = _clean_sql_response(raw_text)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail=f"Could not generate SQL from Ollama: {error}") from error

    return {"sql": sql, "model": OLLAMA_MODEL}


@app.post("/api/query")
async def api_query(request: APIQueryRequest) -> dict:
    try:
        schema_context = get_schema_context(request.table_name)
        base_user_prompt = _format_text_to_sql_prompt(schema_context, request.natural_language_query)
    except (ValueError, OSError, duckdb.Error) as error:
        raise HTTPException(status_code=400, detail=f"Could not prepare query context: {error}") from error

    last_error = ""
    generated_sql = ""

    for attempt in range(1, 4):
        prompt = base_user_prompt
        if attempt > 1 and last_error:
            prompt = (
                f"{base_user_prompt}\n\n"
                f"The previous query failed with error: {last_error}. Please provide a corrected SQL query."
            )

        payload = {
            "model": OLLAMA_MODEL,
            "temperature": 0,
            "messages": [
                {"role": "system", "content": SQL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(OLLAMA_CHAT_URL, json=payload)
                response.raise_for_status()
                raw_text = response.json()["choices"][0]["message"]["content"]
            generated_sql = _clean_sql_response(raw_text)
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
            if attempt == 3:
                raise HTTPException(status_code=502, detail=f"Could not generate SQL from Ollama: {error}") from error
            continue

        try:
            execution_result = _execute_read_only_query(generated_sql)
            return {
                "sql": generated_sql,
                "results": execution_result["rows"],
            }
        except (duckdb.Error, ValueError) as error:
            last_error = str(error)
            if attempt == 3:
                raise HTTPException(status_code=400, detail=last_error) from error

    raise HTTPException(status_code=400, detail=last_error or "Query execution failed after 3 attempts")


def _sql_path(path: Path) -> str:
    return str(path).replace("'", "''")


def _is_numeric(value: str) -> bool:
    try:
        float(value.replace(",", ""))
        return True
    except ValueError:
        return False


def _is_date(value: str) -> bool:
    return bool(re.fullmatch(r"\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T].*)?", value))


def _sanity_check(
    connection: duckdb.DuckDBPyConnection,
    table_name: str,
    columns: list[dict[str, str]],
) -> list[dict[str, str]]:
    warnings = []
    for column in columns:
        if column["type"] not in {"VARCHAR", "STRING"}:
            continue

        name = column["name"]
        quoted_name = '"' + name.replace('"', '""') + '"'
        values = connection.sql(
            f"SELECT {quoted_name} FROM {_quoted_identifier(table_name)} "
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


def _quoted_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def get_schema_context(table_name: str) -> str:
    """Return a prompt-friendly schema and sample rows for a DuckDB table."""
    if not table_name or not table_name.strip():
        raise ValueError("table_name must not be empty")

    quoted_table = _quoted_identifier(table_name.strip())
    with duckdb.connect(str(DATABASE_PATH), read_only=True) as connection:
        columns = connection.sql(f"DESCRIBE {quoted_table}").fetchall()
        sample_result = connection.sql(f"SELECT * FROM {quoted_table} LIMIT 3")
        sample_columns = [column[0] for column in sample_result.description]
        sample_rows = [
            json.dumps(dict(zip(sample_columns, row)), default=str, separators=(",", ":"))
            for row in sample_result.fetchall()
        ]

    column_lines = "\n".join(
        f"- {_quoted_identifier(name)}: {data_type}"
        for name, data_type, *_ in columns
    ) or "- (no columns)"
    sample_text = "\n".join(f"- {row}" for row in sample_rows) or "- (no rows)"
    return (
        f"TABLE: {quoted_table}\n"
        f"COLUMNS:\n{column_lines}\n"
        f"SAMPLE ROWS (up to 3):\n{sample_text}\n"
        "COLUMN HINTS:\n"
        "- Period: Represents Year and Quarter as a float (e.g., 2011.06). To group by year, use FLOOR(Period).\n"
        '- Data_value: This is a generic value column. When a user asks for "jobs", "revenue", or a specific metric, '
        "you MUST filter using the Series_title_1 or Series_title_2 columns to isolate that metric.\n"
        "- Suppressed: Contains nulls or specific flags."
    )


def _table_name_from_filename(filename: str) -> str:
    stem = Path(filename).stem.lower()
    table_name = re.sub(r"[^a-z0-9_]+", "_", stem).strip("_")
    if not table_name:
        table_name = "uploaded_data"
    if table_name[0].isdigit():
        table_name = f"table_{table_name}"
    return table_name


def _schema_prompt(connection: duckdb.DuckDBPyConnection) -> str:
    table_rows = connection.sql(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'main' AND table_type = 'BASE TABLE'
        ORDER BY table_name
        """
    ).fetchall()
    blocks = []
    for (table_name,) in table_rows:
        quoted_table = _quoted_identifier(table_name)
        columns = connection.sql(f"DESCRIBE {quoted_table}").fetchall()
        column_lines = [f"  {_quoted_identifier(name)} {data_type}" for name, data_type, *_ in columns]
        sample_query = connection.sql(f"SELECT * FROM {quoted_table} LIMIT 5")
        sample_columns = [column[0] for column in sample_query.description]
        sample_rows = [
            json.dumps(dict(zip(sample_columns, row)), default=str, separators=(",", ":"))
            for row in sample_query.fetchall()
        ]
        sample_text = "\n".join(f"  {row}" for row in sample_rows) or "  (no rows)"
        blocks.append(
            f"TABLE {quoted_table} (\n{',\n'.join(column_lines)}\n);\n"
            f"-- sample rows (up to 5)\n{sample_text}"
        )
    return "\n\n".join(blocks)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> dict:
    filename = file.filename or ""
    suffix = Path(filename).suffix.lower()
    if suffix not in {".csv", ".xlsx"}:
        raise HTTPException(status_code=415, detail="Only .csv and .xlsx files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")

    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / Path(filename).name
        path.write_bytes(content)
        reader = "read_csv_auto" if suffix == ".csv" else "read_xlsx"
        try:
            DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
            connection = duckdb.connect(str(DATABASE_PATH))
            connection.execute(
                f"CREATE OR REPLACE TABLE uploaded_data AS SELECT * FROM {reader}('{_sql_path(path)}')"
            )
            description = connection.sql("DESCRIBE uploaded_data").fetchall()
            columns = [{"name": row[0], "type": row[1]} for row in description]
            row_count = connection.sql("SELECT COUNT(*) FROM uploaded_data").fetchone()[0]
            preview_result = connection.sql("SELECT * FROM uploaded_data LIMIT 10")
            preview = [
                dict(zip((column[0] for column in preview_result.description), row))
                for row in preview_result.fetchall()
            ]
            warnings = _sanity_check(connection, "uploaded_data", columns)
            schema_text = _schema_prompt(connection)
            connection.close()
        except Exception as error:
            raise HTTPException(status_code=400, detail=f"Could not load file: {error}") from error

    return {
        "filename": filename,
        "table": "uploaded_data",
        "row_count": row_count,
        "columns": columns,
        "preview": preview,
        "schema_text": schema_text,
        "sanity_check": {"passed": not warnings, "warnings": warnings},
    }


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)) -> dict:
    """Ingest a CSV upload into a DuckDB table named after the file."""
    filename = file.filename or ""
    if Path(filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=415, detail="Only .csv files are supported")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")

    table_name = _table_name_from_filename(filename)
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / Path(filename).name
        path.write_bytes(content)
        try:
            DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with duckdb.connect(str(DATABASE_PATH)) as connection:
                quoted_table = _quoted_identifier(table_name)
                connection.execute(
                    f"CREATE OR REPLACE TABLE {quoted_table} AS "
                    f"SELECT * FROM read_csv_auto('{_sql_path(path)}')"
                )
                row_count = connection.sql(f"SELECT COUNT(*) FROM {quoted_table}").fetchone()[0]
        except (duckdb.Error, OSError) as error:
            raise HTTPException(status_code=400, detail=f"Could not load file: {error}") from error

    return {"table": table_name, "row_count": row_count}
